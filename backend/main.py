import os
from datetime import date
from typing import Optional
import psycopg
from psycopg.rows import dict_row
from fastapi import FastAPI, HTTPException, Header
from whatsapp_bot import router as whatsapp_router
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="EcoConecta API - Villas de San Pablo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ecoconecta:ecoconecta123@db:5432/ecoconecta")


def get_conn():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


@app.on_event("startup")
def asegurar_tablas():
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS configuracion_sistema (
                    clave VARCHAR(60) PRIMARY KEY,
                    valor TEXT NOT NULL DEFAULT '',
                    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            cur.execute(
                """
                INSERT INTO configuracion_sistema (clave, valor)
                VALUES ('whatsapp_oficial_numero', '')
                ON CONFLICT (clave) DO NOTHING;

                ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(120) DEFAULT '';
                ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS canal_origen VARCHAR(30) DEFAULT 'web';
                ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cantidad_aproximada VARCHAR(120) DEFAULT '';
                ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS sector_usuario VARCHAR(120) DEFAULT '';
                ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS media_id_imagen VARCHAR(120) DEFAULT '';
                ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS transcripcion_audio TEXT DEFAULT '';
                ALTER TABLE sesiones_whatsapp ADD COLUMN IF NOT EXISTS nombre VARCHAR(120);
                ALTER TABLE sesiones_whatsapp ADD COLUMN IF NOT EXISTS cantidad_aproximada VARCHAR(120);
                ALTER TABLE sesiones_whatsapp ADD COLUMN IF NOT EXISTS sector_usuario VARCHAR(120);
                ALTER TABLE sesiones_whatsapp ADD COLUMN IF NOT EXISTS fecha_preferida VARCHAR(60);
                ALTER TABLE sesiones_whatsapp ADD COLUMN IF NOT EXISTS media_id_imagen VARCHAR(120) DEFAULT '';
                ALTER TABLE sesiones_whatsapp ADD COLUMN IF NOT EXISTS transcripcion_audio TEXT DEFAULT '';
                ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS canal_origen VARCHAR(30) DEFAULT 'web';
                ALTER TABLE sesiones_whatsapp ADD COLUMN IF NOT EXISTS nombre VARCHAR(120);

                INSERT INTO usuarios (nombre, username, password_hash, telefono, direccion, sector_manzana, rol, vehiculo_herramienta, requerimientos_operativos, aprobado)
                VALUES
                ('Administrador General', 'admin', 'admin2026', '573001000001', 'Centro Comunitario Villas de San Pablo', 'Villas de San Pablo', 'admin', '', 'Aprobación de perfiles y gestión de usuarios', TRUE),
                ('Coordinador de Huerteros', 'coord_huerteros', 'huerteros2026', '573001000002', 'Huerta Comunitaria Sector 1', 'Villas de San Pablo', 'coord_huerteros', '', 'Control total flujo orgánico', TRUE),
                ('Coordinador de Recicladores', 'coord_recicladores', 'recicladores2026', '573001000003', 'ECA Villas de San Pablo', 'Villas de San Pablo', 'coord_recicladores', '', 'Control total flujo reciclable', TRUE),
                ('Comunidad Villas de San Pablo', 'comunidad_vsp', 'vsp_directo_2026', '573000000000', 'Villas de San Pablo', 'Villas de San Pablo', 'solicitante_hogar', '', 'Canal directo ciudadano', TRUE)
                ON CONFLICT (username) DO NOTHING;
                """
            )
            conn.commit()
    except Exception as exc:
        print("Aviso inicializando configuracion_sistema:", exc)


class LoginIn(BaseModel):
    username: str
    password: str


class ConfigWhatsAppIn(BaseModel):
    numero: str


class RegistroPerfilIn(BaseModel):
    nombre: str
    username: str
    password: str
    telefono: str
    direccion: str
    sector_manzana: Optional[str] = "Villas de San Pablo"
    rol: str
    vehiculo_herramienta: Optional[str] = ""
    requerimientos_operativos: Optional[str] = ""


class EditarUsuarioIn(BaseModel):
    nombre: str
    username: Optional[str] = None
    password: Optional[str] = None
    telefono: str
    direccion: str
    sector_manzana: Optional[str] = "Villas de San Pablo"
    rol: Optional[str] = None
    vehiculo_herramienta: Optional[str] = ""
    requerimientos_operativos: Optional[str] = ""
    aprobado: bool


class CrearSolicitudIn(BaseModel):
    solicitante_id: Optional[int] = None
    nombre_contacto: Optional[str] = ""
    flujo: str
    direccion_manual: str
    telefono_manual: str
    descripcion: Optional[str] = ""
    ubicacion_gps: Optional[str] = ""
    disponibilidad_horaria: str
    canal_origen: Optional[str] = "web"


class EditarSolicitudCoordIn(BaseModel):
    nombre_contacto: Optional[str] = ""
    direccion_entrega: str
    telefono_contacto: str
    disponibilidad_horaria: str
    descripcion: Optional[str] = ""
    estado: str


class ProgramarSolicitudIn(BaseModel):
    coordinador_id: int
    recolector_id: int
    fecha_programada: date
    hora_programada: str


class CerrarSolicitudIn(BaseModel):
    recolector_id: int
    nota_cierre: Optional[str] = "Recolección realizada en sitio."


class ActualizarReglaPuntosIn(BaseModel):
    puntos_base: int
    descripcion: str


class CrearContenidoIn(BaseModel):
    titulo: str
    flujo: str
    icono: str = "♻️"
    texto_visual: str
    guion_audio: str


class SimularChatbotIn(BaseModel):
    telefono: str
    mensaje: str


def normalizar_telefono(tel: str) -> str:
    limpio = "".join(c for c in (tel or "") if c.isdigit())
    if len(limpio) == 10 and limpio.startswith("3"):
        return "57" + limpio
    return limpio


def extraer_numero_colombia_10(raw: str) -> str:
    limpio = "".join(c for c in (raw or "") if c.isdigit())
    if not limpio:
        return ""
    if limpio.startswith("57") and len(limpio) == 12:
        limpio = limpio[2:]
    return limpio


def registrar_solicitud_interna(
    solicitante_id: Optional[int],
    nombre_contacto: str,
    flujo: str,
    direccion_manual: str,
    telefono_manual: str,
    descripcion: str,
    ubicacion_gps: str,
    disponibilidad_horaria: str,
    canal_origen: str = "web",
):
    with get_conn() as conn, conn.cursor() as cur:
        solicitante = None
        if solicitante_id:
            cur.execute("SELECT * FROM usuarios WHERE id = %s;", (solicitante_id,))
            solicitante = cur.fetchone()
        if not solicitante:
            cur.execute("SELECT * FROM usuarios WHERE username = 'comunidad_vsp' LIMIT 1;")
            solicitante = cur.fetchone()
        if not solicitante:
            cur.execute("SELECT * FROM usuarios ORDER BY id ASC LIMIT 1;")
            solicitante = cur.fetchone()

        rol_coord = "coord_huerteros" if flujo == "organico" else "coord_recicladores"
        cur.execute("SELECT id, nombre, telefono FROM usuarios WHERE rol = %s LIMIT 1;", (rol_coord,))
        coordinador = cur.fetchone()
        if not coordinador:
            raise HTTPException(status_code=500, detail="No hay coordinador configurado para este flujo.")

        prefijo = "ORG" if flujo == "organico" else "REC"
        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 AS sig FROM solicitudes;")
        seq = cur.fetchone()["sig"]
        codigo = f"{prefijo}-{seq:04d}"

        dir_final = (direccion_manual or "").strip() or solicitante["direccion"]
        tel_final = normalizar_telefono(telefono_manual) or solicitante["telefono"]
        nom_final = (nombre_contacto or "").strip() or (
            solicitante["nombre"] if solicitante["username"] != "comunidad_vsp" else f"Vecino ({tel_final[-4:]})"
        )

        cur.execute(
            """
            INSERT INTO solicitudes (
                codigo, solicitante_id, nombre_contacto, flujo, descripcion, direccion_entrega,
                telefono_contacto, ubicacion_gps, disponibilidad_horaria,
                canal_origen, estado, coordinador_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'recibida', %s)
            RETURNING *;
            """,
            (
                codigo,
                solicitante["id"],
                nom_final,
                flujo,
                descripcion,
                dir_final,
                tel_final,
                ubicacion_gps,
                disponibilidad_horaria,
                canal_origen,
                coordinador["id"],
            ),
        )
        nueva = cur.fetchone()

        cur.execute(
            """
            INSERT INTO historial_estados (solicitud_id, estado_anterior, estado_nuevo, actor_id, observacion)
            VALUES (%s, NULL, 'recibida', %s, %s);
            """,
            (
                nueva["id"],
                solicitante["id"],
                f"Solicitud registrada vía {canal_origen.upper()} por {nom_final} en {dir_final} y enviada a {coordinador['nombre']}.",
            ),
        )
        conn.commit()
        return nueva, coordinador, tel_final, dir_final, nom_final


async def procesar_mensaje_chatbot(telefono_raw: str, texto_usuario: str) -> dict:
    telefono = normalizar_telefono(telefono_raw) or "573000000000"
    texto = (texto_usuario or "").strip()
    lower = texto.lower()

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM sesiones_whatsapp WHERE telefono = %s;", (telefono,))
        sesion = cur.fetchone()

        if not sesion or lower in ("hola", "inicio", "menu", "menú", "cancelar", "salir"):
            cur.execute(
                """
                INSERT INTO sesiones_whatsapp (telefono, paso, flujo, direccion, horario, nombre, actualizado_en)
                VALUES (%s, 'esperando_flujo', NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
                ON CONFLICT (telefono) DO UPDATE
                SET paso = 'esperando_flujo', flujo = NULL, direccion = NULL, horario = NULL, nombre = NULL, actualizado_en = CURRENT_TIMESTAMP;
                """,
                (telefono,),
            )
            conn.commit()
            respuesta = (
                "🌱 ¡Hola! Bienvenido a *EcoConecta Villas de San Pablo*.\n\n"
                "Responde con el número de lo que deseas entregar:\n"
                "1️⃣ *Residuos Orgánicos* (cáscaras y comida -> Coordinador de Huerteros)\n"
                "2️⃣ *Residuos Reciclables* (botellas, cartón, latas -> Coordinador de Recicladores)\n"
                "3️⃣ *Aprender a separar residuos*"
            )
            return {"respuesta": respuesta, "solicitud_creada": None}

        paso = sesion["paso"]

        if paso == "esperando_flujo":
            if lower in ("3", "aprender", "info", "informacion"):
                respuesta = (
                    "♻️ *Guía rápida de separación:*\n"
                    "• *Orgánicos (Huerteros):* cáscaras de frutas, verduras y restos de comida sin bolsas.\n"
                    "• *Reciclables (Recicladores):* botellas plásticas vacías, cartón seco, papel y latas.\n\n"
                    "Responde *1* para pedir recolección de Orgánicos o *2* para Reciclables."
                )
                return {"respuesta": respuesta, "solicitud_creada": None}

            if lower.startswith("1") or "organ" in lower or "cascara" in lower or "comida" in lower:
                flujo_sel = "organico"
                etiqueta = "🥬 *Residuos Orgánicos* (Coordinador de Huerteros)"
            elif lower.startswith("2") or "recicl" in lower or "botella" in lower or "carton" in lower:
                flujo_sel = "reciclable"
                etiqueta = "📦 *Residuos Reciclables* (Coordinador de Recicladores)"
            else:
                return {
                    "respuesta": "Por favor responde *1* para Residuos Orgánicos, *2* para Reciclables o *3* para aprender a separar.",
                    "solicitud_creada": None,
                }

            cur.execute(
                """
                UPDATE sesiones_whatsapp
                SET paso = 'esperando_direccion', flujo = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (flujo_sel, telefono),
            )
            conn.commit()
            return {
                "respuesta": f"{etiqueta}.\n\n📍 Escribe ahora tu *dirección manual completa o manzana y casa* donde recogemos:",
                "solicitud_creada": None,
            }

        if paso == "esperando_direccion":
            if len(texto) < 4:
                return {
                    "respuesta": "Escribe una dirección más detallada (ejemplo: Manzana 5 Casa 12, Villas de San Pablo):",
                    "solicitud_creada": None,
                }
            cur.execute(
                """
                UPDATE sesiones_whatsapp
                SET paso = 'esperando_horario', direccion = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (texto, telefono),
            )
            conn.commit()
            return {
                "respuesta": (
                    f"📍 Dirección guardada: *{texto}*\n\n"
                    "⏰ ¿En qué horario prefieres que pasen?\n"
                    "1️⃣ *En la Mañana* (8:00 AM - 12:00 PM)\n"
                    "2️⃣ *En la Tarde* (2:00 PM - 5:00 PM)"
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
                SET paso = 'esperando_nombre', horario = %s, actualizado_en = CURRENT_TIMESTAMP
                WHERE telefono = %s;
                """,
                (horario_sel, telefono),
            )
            conn.commit()
            return {
                "respuesta": "👤 Por último, escribe tu *nombre completo* para registrar la recolección:",
                "solicitud_creada": None,
            }

        if paso == "esperando_nombre":
            flujo_final = sesion["flujo"] or "organico"
            direccion_final = sesion["direccion"] or "Villas de San Pablo"
            horario_final = sesion["horario"] or "Mañana (8:00 AM - 12:00 PM)"
            nombre_final = texto if len(texto) >= 2 else f"Vecino ({telefono[-4:]})"

            cur.execute("DELETE FROM sesiones_whatsapp WHERE telefono = %s;", (telefono,))
            conn.commit()

    nueva, coordinador, tel_final, dir_final, nom_final = registrar_solicitud_interna(
        solicitante_id=None,
        nombre_contacto=nombre_final,
        flujo=flujo_final,
        direccion_manual=direccion_final,
        telefono_manual=telefono,
        descripcion="Solicitud registrada desde asistente guiado",
        ubicacion_gps="",
        disponibilidad_horaria=horario_final,
        canal_origen="asistente_web",
    )

    colectivo = "Huerteros" if flujo_final == "organico" else "Recicladores"
    respuesta = (
        f"✅ *¡Solicitud {nueva['codigo']} registrada!*\n\n"
        f"• *Solicitante:* {nom_final}\n"
        f"• *Colectivo:* {colectivo} ({coordinador['nombre']})\n"
        f"• *Dirección:* {dir_final}\n"
        f"• *Horario:* {horario_final}\n\n"
        "El coordinador ya recibió tu solicitud en EcoConecta."
    )
    return {"respuesta": respuesta, "solicitud_creada": dict(nueva)}


@app.get("/health")
def health():
    return {"status": "ok", "proyecto": "EcoConecta Villas de San Pablo"}


@app.get("/configuracion/whatsapp")
def obtener_configuracion_whatsapp():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT valor FROM configuracion_sistema WHERE clave = 'whatsapp_oficial_numero';")
        row = cur.fetchone()
        local_10 = extraer_numero_colombia_10(row["valor"] if row else "")
        configurado = len(local_10) == 10
        return {
            "indicativo": "+57",
            "numero_local": local_10,
            "numero_completo": f"57{local_10}" if configurado else "",
            "configurado": configurado,
            "enlace_base": f"https://wa.me/57{local_10}" if configurado else "",
        }


@app.put("/configuracion/whatsapp")
def guardar_configuracion_whatsapp(data: ConfigWhatsAppIn, rol_actor: str = Header(default="")):
    if rol_actor not in ("admin", "coord_huerteros", "coord_recicladores"):
        raise HTTPException(status_code=403, detail="Solo el Administrador o Coordinadores pueden configurar el número oficial.")

    raw = (data.numero or "").strip()
    if not raw:
        local_10 = ""
    else:
        local_10 = extraer_numero_colombia_10(raw)
        if len(local_10) != 10:
            raise HTTPException(
                status_code=400,
                detail="Ingresa un número celular colombiano válido de 10 dígitos (el indicativo +57 se agrega automáticamente).",
            )

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO configuracion_sistema (clave, valor, actualizado_en)
            VALUES ('whatsapp_oficial_numero', %s, CURRENT_TIMESTAMP)
            ON CONFLICT (clave) DO UPDATE
            SET valor = EXCLUDED.valor, actualizado_en = CURRENT_TIMESTAMP;
            """,
            (local_10,),
        )
        conn.commit()

    configurado = len(local_10) == 10
    return {
        "indicativo": "+57",
        "numero_local": local_10,
        "numero_completo": f"57{local_10}" if configurado else "",
        "configurado": configurado,
        "enlace_base": f"https://wa.me/57{local_10}" if configurado else "",
    }


@app.post("/auth/login")
def login(data: LoginIn):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, nombre, username, telefono, direccion, sector_manzana, rol,
                   vehiculo_herramienta, requerimientos_operativos, aprobado, puntos_acumulados
            FROM usuarios
            WHERE LOWER(username) = LOWER(%s) AND password_hash = %s;
            """,
            (data.username.strip(), data.password.strip()),
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
        if not user["aprobado"]:
            raise HTTPException(
                status_code=403,
                detail="Tu perfil aún está pendiente de aprobación por el Administrador.",
            )
        return user


@app.post("/usuarios/registro")
async def registrar_perfil(data: RegistroPerfilIn, rol_actor: str = Header(default="")):
    roles_validos = ("huertero", "reciclador", "solicitante_hogar", "unidad_productiva", "coord_huerteros", "coord_recicladores", "admin")
    if data.rol not in roles_validos:
        raise HTTPException(status_code=400, detail="Rol inválido.")

    creado_por_staff = rol_actor in ("admin", "coord_huerteros", "coord_recicladores")
    if data.rol in ("admin", "coord_huerteros", "coord_recicladores") and rol_actor != "admin":
        raise HTTPException(status_code=403, detail="Solo el Administrador puede crear roles administrativos o coordinadores.")

    tel_norm = normalizar_telefono(data.telefono)
    if not tel_norm:
        raise HTTPException(status_code=400, detail="Ingresa un número de WhatsApp válido.")

    requiere_aprobacion = (data.rol in ("huertero", "reciclador")) and not creado_por_staff
    estado_aprobado = True if creado_por_staff else (not requiere_aprobacion)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM usuarios WHERE LOWER(username) = LOWER(%s);", (data.username.strip(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ese nombre de usuario ya está registrado.")

        cur.execute(
            """
            INSERT INTO usuarios (
                nombre, username, password_hash, telefono, direccion, sector_manzana,
                rol, vehiculo_herramienta, requerimientos_operativos, aprobado
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, nombre, username, telefono, direccion, sector_manzana, rol,
                      vehiculo_herramienta, requerimientos_operativos, aprobado, puntos_acumulados;
            """,
            (
                data.nombre.strip(),
                data.username.strip(),
                data.password.strip(),
                tel_norm,
                data.direccion.strip(),
                (data.sector_manzana or "Villas de San Pablo").strip(),
                data.rol,
                (data.vehiculo_herramienta or "").strip(),
                (data.requerimientos_operativos or "").strip(),
                estado_aprobado,
            ),
        )
        creado = cur.fetchone()
        conn.commit()

    return dict(creado)


@app.get("/usuarios")
def listar_usuarios():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, nombre, username, telefono, direccion, sector_manzana, rol,
                   vehiculo_herramienta, requerimientos_operativos, aprobado, puntos_acumulados
            FROM usuarios
            WHERE username != 'comunidad_vsp'
            ORDER BY id ASC;
            """
        )
        return cur.fetchall()


@app.put("/usuarios/{usuario_id}")
async def editar_usuario(usuario_id: int, data: EditarUsuarioIn, rol_actor: str = Header(default="")):
    if rol_actor not in ("coord_huerteros", "coord_recicladores", "admin"):
        raise HTTPException(status_code=403, detail="No autorizado para editar o aprobar perfiles.")

    tel_norm = normalizar_telefono(data.telefono)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM usuarios WHERE id = %s;", (usuario_id,))
        previo = cur.fetchone()
        if not previo:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

        nuevo_username = (data.username or previo["username"]).strip()
        nuevo_rol = (data.rol or previo["rol"]).strip()
        if nuevo_rol != previo["rol"] and rol_actor != "admin":
            raise HTTPException(status_code=403, detail="Solo el Administrador puede cambiar el rol.")

        if data.password and data.password.strip():
            cur.execute(
                """
                UPDATE usuarios
                SET nombre = %s, username = %s, password_hash = %s, telefono = %s,
                    direccion = %s, sector_manzana = %s, rol = %s,
                    vehiculo_herramienta = %s, requerimientos_operativos = %s,
                    aprobado = %s
                WHERE id = %s
                RETURNING id, nombre, username, telefono, direccion, sector_manzana, rol,
                          vehiculo_herramienta, requerimientos_operativos, aprobado, puntos_acumulados;
                """,
                (
                    data.nombre.strip(),
                    nuevo_username,
                    data.password.strip(),
                    tel_norm,
                    data.direccion.strip(),
                    (data.sector_manzana or "Villas de San Pablo").strip(),
                    nuevo_rol,
                    (data.vehiculo_herramienta or "").strip(),
                    (data.requerimientos_operativos or "").strip(),
                    data.aprobado,
                    usuario_id,
                ),
            )
        else:
            cur.execute(
                """
                UPDATE usuarios
                SET nombre = %s, username = %s, telefono = %s,
                    direccion = %s, sector_manzana = %s, rol = %s,
                    vehiculo_herramienta = %s, requerimientos_operativos = %s,
                    aprobado = %s
                WHERE id = %s
                RETURNING id, nombre, username, telefono, direccion, sector_manzana, rol,
                          vehiculo_herramienta, requerimientos_operativos, aprobado, puntos_acumulados;
                """,
                (
                    data.nombre.strip(),
                    nuevo_username,
                    tel_norm,
                    data.direccion.strip(),
                    (data.sector_manzana or "Villas de San Pablo").strip(),
                    nuevo_rol,
                    (data.vehiculo_herramienta or "").strip(),
                    (data.requerimientos_operativos or "").strip(),
                    data.aprobado,
                    usuario_id,
                ),
            )
        actualizado = cur.fetchone()
        conn.commit()

    return dict(actualizado)


@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, rol_actor: str = Header(default="")):
    if rol_actor not in ("coord_huerteros", "coord_recicladores", "admin"):
        raise HTTPException(status_code=403, detail="No autorizado para eliminar usuarios.")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT rol, username FROM usuarios WHERE id = %s;", (usuario_id,))
        u = cur.fetchone()
        if not u:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        if u["username"] in ("admin", "coord_huerteros", "coord_recicladores", "comunidad_vsp"):
            raise HTTPException(status_code=400, detail="No se pueden eliminar las cuentas base del sistema.")
        cur.execute("DELETE FROM usuarios WHERE id = %s;", (usuario_id,))
        conn.commit()
    return {"eliminado": True}


app.include_router(whatsapp_router)

@app.get("/contenidos")
def listar_contenidos():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM contenidos_educativos WHERE activo = TRUE ORDER BY id;")
        return cur.fetchall()


@app.post("/contenidos")
def crear_contenido(data: CrearContenidoIn, rol_actor: str = Header(default="")):
    if rol_actor not in ("coord_huerteros", "coord_recicladores"):
        raise HTTPException(status_code=403, detail="Solo los Coordinadores pueden publicar contenido educativo.")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO contenidos_educativos (titulo, flujo, icono, texto_visual, guion_audio)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *;
            """,
            (data.titulo, data.flujo, data.icono, data.texto_visual, data.guion_audio),
        )
        nuevo = cur.fetchone()
        conn.commit()
        return nuevo


@app.get("/reglas-puntos")
def listar_reglas_puntos():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM reglas_puntos ORDER BY id;")
        return cur.fetchall()


@app.patch("/reglas-puntos/{flujo}")
def actualizar_regla_puntos(flujo: str, data: ActualizarReglaPuntosIn, rol_actor: str = Header(default="")):
    if rol_actor not in ("coord_huerteros", "coord_recicladores"):
        raise HTTPException(status_code=403, detail="Solo los Coordinadores pueden editar las reglas de puntos.")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reglas_puntos
            SET puntos_base = %s, descripcion = %s
            WHERE flujo = %s
            RETURNING *;
            """,
            (data.puntos_base, data.descripcion, flujo),
        )
        regla = cur.fetchone()
        if not regla:
            raise HTTPException(status_code=404, detail="Flujo no encontrado")
        conn.commit()
        return regla


@app.post("/solicitudes")
async def crear_solicitud(data: CrearSolicitudIn):
    if data.flujo not in ("organico", "reciclable"):
        raise HTTPException(status_code=400, detail="Flujo inválido.")
    if not data.direccion_manual.strip():
        raise HTTPException(status_code=400, detail="Debes escribir la dirección manualmente.")
    if not data.telefono_manual.strip():
        raise HTTPException(status_code=400, detail="Debes escribir el número de WhatsApp.")

    nueva, coordinador, tel_final, dir_final, nom_final = registrar_solicitud_interna(
        solicitante_id=data.solicitante_id,
        nombre_contacto=data.nombre_contacto or "",
        flujo=data.flujo,
        direccion_manual=data.direccion_manual,
        telefono_manual=data.telefono_manual,
        descripcion=data.descripcion or "",
        ubicacion_gps=data.ubicacion_gps or "",
        disponibilidad_horaria=data.disponibilidad_horaria,
        canal_origen=data.canal_origen or "web",
    )

    colectivo = "Huerteros" if data.flujo == "organico" else "Recicladores"
    mensaje_wa = (
        f"🌱 Hola equipo EcoConecta, solicito recolección ({nueva['codigo']}) de residuos *{data.flujo.upper()}*.\n"
        f"• Nombre: {nom_final}\n"
        f"• Dirección: {dir_final}\n"
        f"• WhatsApp contacto: {tel_final}\n"
        f"• Horario: {data.disponibilidad_horaria}\n"
        f"• Detalle: {data.descripcion or 'Sin nota adicional'}"
    )
    res_dict = dict(nueva)
    res_dict["mensaje_whatsapp"] = mensaje_wa
    res_dict["colectivo"] = colectivo
    return res_dict


@app.get("/solicitudes")
def listar_solicitudes(rol: str = Header(default=""), usuario_id: int = Header(default=0)):
    if rol not in ("admin", "coord_huerteros", "coord_recicladores", "huertero", "reciclador"):
        return []

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT s.*,
                   COALESCE(NULLIF(s.nombre_contacto, ''), u.nombre) AS solicitante_nombre,
                   COALESCE(NULLIF(s.telefono_contacto, ''), u.telefono) AS solicitante_telefono,
                   COALESCE(NULLIF(s.direccion_entrega, ''), u.direccion) AS solicitante_direccion,
                   u.sector_manzana,
                   r.nombre AS recolector_nombre,
                   r.telefono AS recolector_telefono
            FROM solicitudes s
            JOIN usuarios u ON u.id = s.solicitante_id
            LEFT JOIN usuarios r ON r.id = s.recolector_id
            ORDER BY s.creado_en DESC;
            """
        )
        filas = cur.fetchall()

    resultado = []
    for f in filas:
        item = dict(f)
        if rol == "coord_huerteros" and item["flujo"] != "organico":
            continue
        if rol == "coord_recicladores" and item["flujo"] != "reciclable":
            continue
        if rol in ("huertero", "reciclador") and item["recolector_id"] != usuario_id:
            continue
        resultado.append(item)
    return resultado


@app.get("/solicitudes/{solicitud_id}/historial")
def historial_solicitud(solicitud_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT h.*, u.nombre AS actor_nombre
            FROM historial_estados h
            JOIN usuarios u ON u.id = h.actor_id
            WHERE h.solicitud_id = %s
            ORDER BY h.creado_en ASC;
            """,
            (solicitud_id,),
        )
        return cur.fetchall()


@app.patch("/solicitudes/{solicitud_id}/programar")
async def programar_solicitud(
    solicitud_id: int,
    data: ProgramarSolicitudIn,
    rol_actor: str = Header(default=""),
):
    if rol_actor not in ("coord_huerteros", "coord_recicladores"):
        raise HTTPException(status_code=403, detail="Solo los Coordinadores tienen control total para programar y asignar.")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM solicitudes WHERE id = %s;", (solicitud_id,))
        sol = cur.fetchone()
        if not sol:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")

        if rol_actor == "coord_huerteros" and sol["flujo"] != "organico":
            raise HTTPException(status_code=403, detail="Solo puedes gestionar el flujo orgánico.")
        if rol_actor == "coord_recicladores" and sol["flujo"] != "reciclable":
            raise HTTPException(status_code=403, detail="Solo puedes gestionar el flujo reciclable.")

        cur.execute("SELECT nombre, telefono, aprobado FROM usuarios WHERE id = %s;", (data.recolector_id,))
        recolector = cur.fetchone()
        if not recolector or not recolector["aprobado"]:
            raise HTTPException(status_code=400, detail="Recolector no encontrado o aún pendiente de aprobación por el Administrador.")

        tel_vecino = normalizar_telefono(sol.get("telefono_contacto") or "")
        tel_recolector = normalizar_telefono(recolector["telefono"] or "")
        dir_destino = (sol.get("direccion_entrega") or "").strip()
        nom_vecino = (sol.get("nombre_contacto") or "").strip() or "Vecino"
        gps_txt = f" (GPS: {sol['ubicacion_gps']})" if sol.get("ubicacion_gps") else ""

        cur.execute(
            """
            UPDATE solicitudes
            SET coordinador_id = %s,
                recolector_id = %s,
                fecha_programada = %s,
                hora_programada = %s,
                estado = 'programada',
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *;
            """,
            (data.coordinador_id, data.recolector_id, data.fecha_programada, data.hora_programada, solicitud_id),
        )
        actualizada = cur.fetchone()

        cur.execute(
            """
            INSERT INTO historial_estados (solicitud_id, estado_anterior, estado_nuevo, actor_id, observacion)
            VALUES (%s, %s, 'programada', %s, %s);
            """,
            (
                solicitud_id,
                sol["estado"],
                data.coordinador_id,
                f"Programada para el {data.fecha_programada} a las {data.hora_programada} en {dir_destino}. Encargado: {recolector['nombre']}.",
            ),
        )
        conn.commit()

    msg_recolector = (
        f"🚛 EcoConecta - Nueva Tarea Asignada ({sol['codigo']}):\n"
        f"• Residuo: {sol['flujo'].upper()}\n"
        f"• Ubicación: {dir_destino}{gps_txt}\n"
        f"• Día asignado: {data.fecha_programada}\n"
        f"• Hora asignada: {data.hora_programada}\n"
        f"• Solicitante: {nom_vecino} (WhatsApp: +{tel_vecino})"
    )
    msg_vecino = (
        f"📅 EcoConecta ({sol['codigo']}): Tu recolección en {dir_destino} quedó programada para el {data.fecha_programada} "
        f"a las {data.hora_programada}. Pasará {recolector['nombre']}."
    )

    res = dict(actualizada)
    res["msg_recolector"] = msg_recolector
    res["msg_vecino"] = msg_vecino
    res["tel_recolector"] = tel_recolector
    res["tel_vecino"] = tel_vecino
    return res


@app.put("/solicitudes/{solicitud_id}")
def editar_solicitud_coordinador(
    solicitud_id: int,
    data: EditarSolicitudCoordIn,
    usuario_id: int = Header(default=1),
    rol_actor: str = Header(default=""),
):
    if rol_actor not in ("coord_huerteros", "coord_recicladores"):
        raise HTTPException(status_code=403, detail="Solo los Coordinadores tienen control para editar solicitudes.")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM solicitudes WHERE id = %s;", (solicitud_id,))
        sol = cur.fetchone()
        if not sol:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")

        cur.execute(
            """
            UPDATE solicitudes
            SET nombre_contacto = %s,
                direccion_entrega = %s,
                telefono_contacto = %s,
                disponibilidad_horaria = %s,
                descripcion = %s,
                estado = %s,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *;
            """,
            (
                (data.nombre_contacto or sol["nombre_contacto"]).strip(),
                data.direccion_entrega.strip(),
                normalizar_telefono(data.telefono_contacto),
                data.disponibilidad_horaria.strip(),
                (data.descripcion or "").strip(),
                data.estado,
                solicitud_id,
            ),
        )
        editada = cur.fetchone()
        cur.execute(
            """
            INSERT INTO historial_estados (solicitud_id, estado_anterior, estado_nuevo, actor_id, observacion)
            VALUES (%s, %s, %s, %s, 'Solicitud editada por el Coordinador.');
            """,
            (solicitud_id, sol["estado"], data.estado, usuario_id),
        )
        conn.commit()
        return editada


@app.delete("/solicitudes/{solicitud_id}")
def eliminar_solicitud_coordinador(solicitud_id: int, rol_actor: str = Header(default="")):
    if rol_actor not in ("coord_huerteros", "coord_recicladores"):
        raise HTTPException(status_code=403, detail="Solo los Coordinadores pueden eliminar solicitudes.")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM solicitudes WHERE id = %s;", (solicitud_id,))
        conn.commit()
    return {"eliminada": True}


@app.patch("/solicitudes/{solicitud_id}/cerrar")
async def cerrar_solicitud(solicitud_id: int, data: CerrarSolicitudIn):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM solicitudes WHERE id = %s;", (solicitud_id,))
        sol = cur.fetchone()
        if not sol:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        if sol["estado"] == "recolectada":
            raise HTTPException(status_code=400, detail="La solicitud ya fue cerrada.")

        cur.execute("SELECT puntos_base FROM reglas_puntos WHERE flujo = %s AND activo = TRUE;", (sol["flujo"],))
        regla = cur.fetchone()
        puntos = regla["puntos_base"] if regla else 10

        cur.execute(
            """
            UPDATE solicitudes
            SET estado = 'recolectada',
                puntos_otorgados = %s,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *;
            """,
            (puntos, solicitud_id),
        )
        cerrada = cur.fetchone()

        cur.execute(
            """
            INSERT INTO historial_estados (solicitud_id, estado_anterior, estado_nuevo, actor_id, observacion)
            VALUES (%s, %s, 'recolectada', %s, %s);
            """,
            (solicitud_id, sol["estado"], data.recolector_id, f"{data.nota_cierre} (+{puntos} puntos)"),
        )
        conn.commit()

    return cerrada