import os
import json
from datetime import datetime, date
from typing import Optional
import httpx
import psycopg
from psycopg.rows import dict_row
from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

router = APIRouter()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ecoconecta:ecoconecta123@db:5432/ecoconecta")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "").strip()
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "").strip()
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "ecoconecta_vsp_2026").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()


def get_conn():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def normalizar_telefono(tel: str) -> str:
    limpio = "".join(c for c in (tel or "") if c.isdigit())
    if len(limpio) == 10 and limpio.startswith("3"):
        return "57" + limpio
    return limpio


class SimularChatbotIn(BaseModel):
    telefono: str
    mensaje: str
    tipo: Optional[str] = "text"


async def enviar_whatsapp_cloud(telefono: str, mensaje_texto: str) -> dict:
    destino = normalizar_telefono(telefono)
    if not destino:
        return {"enviado": False, "modo": "sin_telefono"}

    token = os.getenv("WHATSAPP_TOKEN", "").strip()
    phone_id = os.getenv("WHATSAPP_PHONE_ID", "").strip()
    if not token or not phone_id:
        print(f"[CAMILO WA SIMULADO -> +{destino}]: {mensaje_texto}")
        return {"enviado": False, "modo": "pendiente_credenciales_meta", "destino": destino}

    url = f"https://graph.facebook.com/v22.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": destino,
        "type": "text",
        "text": {"body": mensaje_texto},
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload, headers=headers)
            data = resp.json()
            ok = resp.status_code in (200, 201)
            if not ok:
                print(f"[ERROR META CLOUD API -> +{destino}]: {data}")
            return {"enviado": ok, "modo": "whatsapp_cloud_api", "destino": destino, "detalle": data}
    except Exception as exc:
        print(f"[EXCEPCION RED META -> +{destino}]: {exc}")
        return {"enviado": False, "modo": "error_red", "detalle": str(exc)}


async def descargar_media_meta(media_id: str) -> tuple[Optional[bytes], str]:
    token = os.getenv("WHATSAPP_TOKEN", "").strip()
    if not token or not media_id:
        return None, ""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            meta_res = await client.get(f"https://graph.facebook.com/v22.0/{media_id}", headers=headers)
            if meta_res.status_code != 200:
                return None, ""
            info = meta_res.json()
            media_url = info.get("url", "")
            mime_type = info.get("mime_type", "audio/ogg")
            if not media_url:
                return None, mime_type
            bin_res = await client.get(media_url, headers=headers)
            if bin_res.status_code == 200:
                return bin_res.content, mime_type
    except Exception as exc:
        print("Error descargando media de Meta:", exc)
    return None, ""


async def transcribir_nota_voz(media_id: str) -> str:
    audio_bytes, mime_type = await descargar_media_meta(media_id)
    if not audio_bytes:
        return ""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return "[Nota de voz recibida en WhatsApp - configurar OPENAI_API_KEY para transcripción automática]"
    ext = "ogg" if "ogg" in mime_type else ("mp4" if "mp4" in mime_type else "mp3")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            files = {"file": (f"nota_voz.{ext}", audio_bytes, mime_type or "audio/ogg")}
            data = {"model": "whisper-1", "language": "es"}
            resp = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                data=data,
                files=files,
            )
            if resp.status_code == 200:
                return resp.json().get("text", "").strip()
    except Exception as exc:
        print("Error transcribiendo nota de voz:", exc)
    return ""


def parsear_fecha_usuario(texto: str) -> Optional[date]:
    t = (texto or "").strip().lower()
    if t in ("hoy", "ahora"):
        return date.today()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(t, fmt).date()
        except ValueError:
            continue
    return None


def asignar_recolector_por_sector(cur, flujo: str, sector_texto: str):
    rol_objetivo = "huertero" if flujo == "organico" else "reciclador"
    sector_clean = (sector_texto or "").strip()
    if sector_clean:
        cur.execute(
            """
            SELECT id, nombre, telefono, sector_manzana, vehiculo_herramienta
            FROM usuarios
            WHERE rol = %s AND aprobado = TRUE
              AND (LOWER(sector_manzana) LIKE LOWER(%s) OR LOWER(direccion) LIKE LOWER(%s))
            ORDER BY id ASC
            LIMIT 1;
            """,
            (rol_objetivo, f"%{sector_clean}%", f"%{sector_clean}%"),
        )
        match = cur.fetchone()
        if match:
            return match

    cur.execute(
        """
        SELECT id, nombre, telefono, sector_manzana, vehiculo_herramienta
        FROM usuarios
        WHERE rol = %s AND aprobado = TRUE
        ORDER BY id ASC
        LIMIT 1;
        """,
        (rol_objetivo,),
    )
    return cur.fetchone()


def consultar_historial_telefono(telefono: str) -> str:
    tel = normalizar_telefono(telefono)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT s.codigo, s.flujo, s.estado, s.direccion_entrega, s.fecha_programada,
                   s.hora_programada, r.nombre AS recolector_nombre
            FROM solicitudes s
            LEFT JOIN usuarios r ON r.id = s.recolector_id
            WHERE s.telefono_contacto = %s
            ORDER BY s.creado_en DESC
            LIMIT 5;
            """,
            (tel,),
        )
        rows = cur.fetchall()
        if not rows:
            return (
                "📋 *Historial de Solicitudes*\n"
                "Aún no tienes solicitudes registradas con este número en EcoConecta Villas de San Pablo.\n\n"
                "Escribe *Hola* para pedir tu primera recolección."
            )
        lineas = ["📋 *Tus últimas solicitudes en EcoConecta:*\n"]
        for r in rows:
            rec_txt = f" | Encargado: {r['recolector_nombre']}" if r["recolector_nombre"] else ""
            prog_txt = f" ({r['fecha_programada']} {r['hora_programada'] or ''})" if r["fecha_programada"] else ""
            lineas.append(
                f"• *{r['codigo']}* [{r['flujo'].upper()}] -> Estado: *{r['estado'].upper()}*{prog_txt}{rec_txt}\n"
                f"  📍 {r['direccion_entrega']}"
            )
        lineas.append("\nEscribe *Hola* para volver al menú principal.")
        return "\n".join(lineas)


async def procesar_turno_camilo(
    telefono_raw: str,
    texto_usuario: str,
    media_imagen_id: str = "",
    transcripcion_voz: str = "",
) -> dict:
    telefono = normalizar_telefono(telefono_raw) or "573000000000"
    texto = (texto_usuario or "").strip()
    lower = texto.lower()

    if lower in ("4", "historial", "mis solicitudes", "estado"):
        return {"respuesta": consultar_historial_telefono(telefono), "solicitud_creada": None}

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM sesiones_whatsapp WHERE telefono = %s;", (telefono,))
        sesion = cur.fetchone()

        if not sesion or lower in ("hola", "buenas", "buenos dias", "buenas tardes", "inicio", "menu", "menú", "cancelar"):
            cur.execute(
                """
                INSERT INTO sesiones_whatsapp (
                    telefono, paso, flujo, cantidad_aproximada, direccion, sector_usuario,
                    fecha_preferida, horario, nombre, media_id_imagen, transcripcion_audio, actualizado_en
                )
                VALUES (%s, 'esperando_opcion', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', '', CURRENT_TIMESTAMP)
                ON CONFLICT (telefono) DO UPDATE
                SET paso = 'esperando_opcion', flujo = NULL, cantidad_aproximada = NULL,
                    direccion = NULL, sector_usuario = NULL, fecha_preferida = NULL,
                    horario = NULL, nombre = NULL, media_id_imagen = '', transcripcion_audio = '',
                    actualizado_en = CURRENT_TIMESTAMP;
                """,
                (telefono,),
            )
            conn.commit()
            bienvenida = (
                "🌱 ¡Hola vecino/a! Soy *Camilo*, tu asistente comunitario de *EcoConecta Villas de San Pablo*.\n\n"
                "Te ayudo las 24 horas a coordinar la recolección puerta a puerta de tus residuos separados:\n"
                "1️⃣ *Residuos Orgánicos* (cáscaras de frutas, verduras y restos de comida -> Huerteros)\n"
                "2️⃣ *Residuos Reciclables* (botellas plásticas, cartón limpio, papel, latas -> Recicladores)\n"
                "3️⃣ *¿Cómo funciona EcoConecta y cómo separar?*\n"
                "4️⃣ *Consultar estado e historial de mis solicitudes*\n\n"
                "💬 Puedes responder con texto, enviarme una *nota de voz* o adjuntar una *foto* de tus residuos."
            )
            return {"respuesta": bienvenida, "solicitud_creada": None}

        paso = sesion["paso"]
        img_acum = media_imagen_id or (sesion.get("media_id_imagen") or "")
        voz_acum = transcripcion_voz or (sesion.get("transcripcion_audio") or "")

        if paso == "esperando_opcion":
            if lower.startswith("3") or "funciona" in lower or "separar" in lower or "ayuda" in lower:
                explicacion = (
                    "♻️ *¿Cómo funciona EcoConecta Villas de San Pablo?*\n\n"
                    "1. Separas en casa:\n"
                    "   • *Orgánicos:* cáscaras, frutas, verduras y borra de café (sin bolsas ni químicos).\n"
                    "   • *Reciclables:* plástico, cartón seco, papel limpio y latas.\n"
                    "2. Me indicas cantidad, dirección/sector, fecha y horario.\n"
                    "3. Asignamos al huertero o reciclador aprobado de tu sector y te avisamos por aquí.\n\n"
                    "Responde *1* para pedir recolección de *Orgánicos* o *2* para *Reciclables*."
                )
                return {"respuesta": explicacion, "solicitud_creada": None}

            if lower.startswith("1") or "organ" in lower or "cascara" in lower or "verdura" in lower or "comida" in lower:
                flujo_sel = "organico"
                etiqueta = "🥬 *Residuos Orgánicos* (Red de Huerteros)"
            elif lower.startswith("2") or "recicl" in lower or "botella" in lower or "carton" in lower or "plastico" in lower:
                flujo_sel = "reciclable"
                etiqueta = "📦 *Residuos Reciclables* (Asociación de Recicladores)"
            else:
                return {
                    "respuesta": "No logré identificar el tipo de residuo. Por favor responde:\n*1* para *Orgánicos*\n*2* para *Reciclables*\n*3* para saber cómo funciona\n*4* para ver tu historial.",
                    "solicitud_creada": None,
                }

            cur.execute(
                """
                UPDATE sesiones_whatsapp
                SET paso = 'esperando_cantidad', flujo = %s, media_id_imagen = %s,
                    transcripcion_audio = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (flujo_sel, img_acum, voz_acum, telefono),
            )
            conn.commit()
            nota_media = " 📸 *(Foto recibida)*" if media_imagen_id else ""
            return {
                "respuesta": f"¡Perfecto! Elegiste {etiqueta}.{nota_media}\n\n⚖️ ¿Cuál es la *cantidad aproximada* que vas a entregar? (Ejemplo: *2 bolsas medianas*, *5 kilos* o *1 caja*):",
                "solicitud_creada": None,
            }

        if paso == "esperando_cantidad":
            cantidad_txt = texto if len(texto) >= 2 else "1 bolsa mediana"
            cur.execute(
                """
                UPDATE sesiones_whatsapp
                SET paso = 'esperando_direccion_sector', cantidad_aproximada = %s,
                    media_id_imagen = %s, transcripcion_audio = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (cantidad_txt, img_acum, voz_acum, telefono),
            )
            conn.commit()
            return {
                "respuesta": (
                    f"⚖️ Cantidad anotada: *{cantidad_txt}*\n\n"
                    "📍 Escribe ahora tu *dirección exacta y sector/manzana* en Villas de San Pablo (Ejemplo: *Sector 2, Manzana 8 Casa 14*):"
                ),
                "solicitud_creada": None,
            }

        if paso == "esperando_direccion_sector":
            if len(texto) < 4:
                return {
                    "respuesta": "Por favor escribe una dirección más completa con tu sector o manzana (Ejemplo: *Sector 1 Manzana 4 Casa 10*):",
                    "solicitud_creada": None,
                }
            cur.execute(
                """
                UPDATE sesiones_whatsapp
                SET paso = 'esperando_fecha', direccion = %s, sector_usuario = %s,
                    media_id_imagen = %s, transcripcion_audio = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (texto, texto, img_acum, voz_acum, telefono),
            )
            conn.commit()
            return {
                "respuesta": (
                    f"📍 Dirección y sector guardados: *{texto}*\n\n"
                    "📅 ¿Para qué *fecha* deseas la recolección? (Escribe *Hoy* o una fecha como *2026-11-25* o *25/11/2026*):"
                ),
                "solicitud_creada": None,
            }

        if paso == "esperando_fecha":
            fecha_txt = texto if len(texto) >= 3 else str(date.today())
            cur.execute(
                """
                UPDATE sesiones_whatsapp
                SET paso = 'esperando_horario', fecha_preferida = %s,
                    media_id_imagen = %s, transcripcion_audio = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (fecha_txt, img_acum, voz_acum, telefono),
            )
            conn.commit()
            return {
                "respuesta": (
                    f"📅 Fecha solicitada: *{fecha_txt}*\n\n"
                    "⏰ ¿En qué *horario* prefieres que pasemos?\n"
                    "1️⃣ *Mañana* (8:00 AM - 12:00 PM)\n"
                    "2️⃣ *Tarde* (2:00 PM - 5:00 PM)"
                ),
                "solicitud_creada": None,
            }

        if paso == "esperando_horario":
            horario_sel = (
                "Tarde (2:00 PM - 5:00 PM)"
                if (lower.startswith("2") or "tarde" in lower)
                else "Mañana (8:00 AM - 12:00 PM)"
            )
            cur.execute(
                """
                UPDATE sesiones_whatsapp
                SET paso = 'esperando_nombre', horario = %s,
                    media_id_imagen = %s, transcripcion_audio = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (horario_sel, img_acum, voz_acum, telefono),
            )
            conn.commit()
            return {
                "respuesta": "👤 Por último, escribe tu *nombre completo* para confirmar el registro:",
                "solicitud_creada": None,
            }

        if paso == "esperando_nombre":
            flujo_final = sesion["flujo"] or "organico"
            cantidad_final = sesion.get("cantidad_aproximada") or "No especificada"
            direccion_final = sesion["direccion"] or "Villas de San Pablo"
            sector_final = sesion.get("sector_usuario") or direccion_final
            fecha_pref_txt = sesion.get("fecha_preferida") or str(date.today())
            fecha_prog_date = parsear_fecha_usuario(fecha_pref_txt)
            horario_final = sesion["horario"] or "Mañana (8:00 AM - 12:00 PM)"
            nombre_final = texto if len(texto) >= 2 else f"Vecino ({telefono[-4:]})"

            cur.execute("SELECT id FROM usuarios WHERE username = 'comunidad_vsp' LIMIT 1;")
            sol_base = cur.fetchone()
            if not sol_base:
                cur.execute("SELECT id FROM usuarios ORDER BY id ASC LIMIT 1;")
                sol_base = cur.fetchone()

            rol_coord = "coord_huerteros" if flujo_final == "organico" else "coord_recicladores"
            cur.execute("SELECT id, nombre FROM usuarios WHERE rol = %s LIMIT 1;", (rol_coord,))
            coordinador = cur.fetchone()

            recolector = asignar_recolector_por_sector(cur, flujo_final, sector_final)
            recolector_id = recolector["id"] if recolector else None
            estado_inicial = "programada" if (recolector and fecha_prog_date) else "recibida"

            prefijo = "ORG" if flujo_final == "organico" else "REC"
            cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS sig FROM solicitudes;")
            seq = cur.fetchone()["sig"]
            codigo = f"{prefijo}-{seq:04d}"

            desc_partes = [f"Cantidad aprox: {cantidad_final}", f"Fecha solicitada: {fecha_pref_txt}"]
            if img_acum:
                desc_partes.append(f"Imagen WhatsApp ID: {img_acum}")
            if voz_acum:
                desc_partes.append(f"Audio transcrito: {voz_acum}")
            descripcion_final = " | ".join(desc_partes)

            cur.execute(
                """
                INSERT INTO solicitudes (
                    codigo, solicitante_id, nombre_contacto, flujo, cantidad_aproximada,
                    descripcion, direccion_entrega, sector_usuario, telefono_contacto,
                    disponibilidad_horaria, canal_origen, estado, coordinador_id,
                    recolector_id, fecha_programada, hora_programada, media_id_imagen, transcripcion_audio
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'whatsapp_cloud', %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    codigo,
                    sol_base["id"],
                    nombre_final,
                    flujo_final,
                    cantidad_final,
                    descripcion_final,
                    direccion_final,
                    sector_final,
                    telefono,
                    horario_final,
                    estado_inicial,
                    coordinador["id"] if coordinador else None,
                    recolector_id,
                    fecha_prog_date,
                    horario_final if estado_inicial == "programada" else None,
                    img_acum,
                    voz_acum,
                ),
            )
            nueva = cur.fetchone()

            obs_hist = (
                f"Solicitud creada por Camilo (WhatsApp Cloud API). Cantidad: {cantidad_final}. "
                + (
                    f"Asignada automáticamente por sector a {recolector['nombre']}."
                    if recolector
                    else "Pendiente de asignación en bandeja del Coordinador."
                )
            )
            cur.execute(
                """
                INSERT INTO historial_estados (solicitud_id, estado_anterior, estado_nuevo, actor_id, observacion)
                VALUES (%s, NULL, %s, %s, %s);
                """,
                (nueva["id"], estado_inicial, sol_base["id"], obs_hist),
            )
            cur.execute("DELETE FROM sesiones_whatsapp WHERE telefono = %s;", (telefono,))
            conn.commit()

    if recolector:
        msg_rec = (
            f"🚛 *EcoConecta - Nueva Recolección Asignada ({nueva['codigo']})*\n"
            f"• *Tipo:* {flujo_final.upper()}\n"
            f"• *Cantidad aprox:* {cantidad_final}\n"
            f"• *Dirección / Sector:* {direccion_final}\n"
            f"• *Fecha y horario:* {fecha_pref_txt} ({horario_final})\n"
            f"• *Habitante:* {nombre_final} (+{telefono})\n"
            + (f"• *Nota de voz transcrita:* {voz_acum}\n" if voz_acum else "")
            + "Ingresa al panel de EcoConecta para confirmar cuando completes la recolección."
        )
        await enviar_whatsapp_cloud(recolector["telefono"], msg_rec)

    asignado_txt = (
        f"• *Encargado asignado:* {recolector['nombre']} (ya fue notificado)\n"
        if recolector
        else "• *Estado:* Recibida por el Coordinador para asignación\n"
    )
    confirmacion = (
        f"✅ *¡Solicitud {nueva['codigo']} confirmada!*\n\n"
        f"Gracias *{nombre_final}*, Camilo ya registró tu recolección en EcoConecta:\n"
        f"• *Residuo:* {flujo_final.upper()}\n"
        f"• *Cantidad:* {cantidad_final}\n"
        f"• *Dirección / Sector:* {direccion_final}\n"
        f"• *Fecha y horario:* {fecha_pref_txt} - {horario_final}\n"
        f"{asignado_txt}\n"
        "Escribe *4* en cualquier momento para ver el historial y estado de tus solicitudes."
    )
    return {"respuesta": confirmacion, "solicitud_creada": dict(nueva)}


@router.get("/webhook/whatsapp")
def verificar_webhook_meta(
    hub_mode: Optional[str] = Query(default=None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(default=None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(default=None, alias="hub.challenge"),
):
    verify_env = os.getenv("WHATSAPP_VERIFY_TOKEN", "ecoconecta_vsp_2026").strip()
    if hub_mode == "subscribe" and hub_verify_token == verify_env:
        return PlainTextResponse(content=hub_challenge or "", status_code=200)
    raise HTTPException(status_code=403, detail="Verify token inválido")


@router.post("/webhook/whatsapp")
async def recibir_eventos_whatsapp(request: Request):
    body = await request.json()
    try:
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    remitente = msg.get("from", "")
                    tipo = msg.get("type", "")
                    texto_interpretado = ""
                    media_img_id = ""
                    transcripcion = ""

                    if tipo == "text":
                        texto_interpretado = msg.get("text", {}).get("body", "")
                    elif tipo == "audio":
                        media_id = msg.get("audio", {}).get("id", "")
                        transcripcion = await transcribir_nota_voz(media_id)
                        texto_interpretado = transcripcion or "Nota de voz enviada"
                    elif tipo == "image":
                        media_img_id = msg.get("image", {}).get("id", "")
                        caption = msg.get("image", {}).get("caption", "").strip()
                        texto_interpretado = caption or "Imagen de residuos adjunta"

                    if remitente and (texto_interpretado or media_img_id):
                        res = await procesar_turno_camilo(
                            telefono_raw=remitente,
                            texto_usuario=texto_interpretado,
                            media_imagen_id=media_img_id,
                            transcripcion_voz=transcripcion,
                        )
                        await enviar_whatsapp_cloud(remitente, res["respuesta"])
    except Exception as exc:
        print("Error procesando webhook Meta:", exc)
    return {"status": "ok"}


@router.post("/chatbot/simular")
async def probar_camilo_web(data: SimularChatbotIn):
    res = await procesar_turno_camilo(
        telefono_raw=data.telefono,
        texto_usuario=data.mensaje,
    )
    if data.telefono:
        res["whatsapp_estado"] = await enviar_whatsapp_cloud(data.telefono, res["respuesta"])
    return res