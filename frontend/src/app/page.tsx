"use client";

import React, { useEffect, useState } from "react";

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

interface ConfigWhatsApp {
  indicativo: string;
  numero_local: string;
  numero_completo: string;
  configurado: boolean;
  enlace_base: string;
}

interface Usuario {
  id: number;
  nombre: string;
  username: string;
  telefono: string;
  direccion: string;
  sector_manzana: string;
  rol: string;
  vehiculo_herramienta: string;
  requerimientos_operativos: string;
  aprobado: boolean;
  puntos_acumulados: number;
}

interface ContenidoEducativo {
  id: number;
  titulo: string;
  flujo: string;
  icono: string;
  texto_visual: string;
  guion_audio: string;
}

interface ReglaPuntos {
  id: number;
  flujo: "organico" | "reciclable";
  puntos_base: number;
  descripcion: string;
  activo: boolean;
}

interface Solicitud {
  id: number;
  codigo: string;
  solicitante_id: number;
  solicitante_nombre: string;
  solicitante_telefono: string;
  solicitante_direccion: string;
  flujo: "organico" | "reciclable";
  descripcion: string;
  ubicacion_gps?: string;
  disponibilidad_horaria: string;
  canal_origen?: string;
  estado: string;
  recolector_id: number | null;
  recolector_nombre: string | null;
  recolector_telefono?: string | null;
  fecha_programada: string | null;
  hora_programada: string | null;
  puntos_otorgados: number;
}

interface HistorialItem {
  id: number;
  estado_anterior: string | null;
  estado_nuevo: string;
  actor_nombre: string;
  observacion: string;
  creado_en: string;
}

interface MensajeChat {
  emisor: "usuario" | "bot";
  texto: string;
}

export default function EcoConectaPage() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [contenidos, setContenidos] = useState<ContenidoEducativo[]>([]);
  const [reglasPuntos, setReglasPuntos] = useState<ReglaPuntos[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [historialAbierto, setHistorialAbierto] = useState<Record<number, HistorialItem[]>>({});

  const [configWa, setConfigWa] = useState<ConfigWhatsApp>({
    indicativo: "+57",
    numero_local: "",
    numero_completo: "",
    configurado: false,
    enlace_base: "",
  });
  const [inputWaOficial, setInputWaOficial] = useState<string>("");

  const [audioHabilitado, setAudioHabilitado] = useState<boolean>(true);
  const [modoEscucharPrimero, setModoEscucharPrimero] = useState<boolean>(false);
  const [preseleccionado, setPreseleccionado] = useState<string | null>(null);

  const [vistaPublica, setVistaPublica] = useState<"pedir" | "aprender" | "whatsapp" | "registro" | "login">("pedir");
  const [vistaCoord, setVistaCoord] = useState<"bandeja" | "equipo" | "config">("bandeja");
  const [filtroAdminSol, setFiltroAdminSol] = useState<"pendientes" | "todas" | "completadas">("pendientes");
  const [pestanaActiva, setPestanaActiva] = useState<"gestion" | "calendario">("gestion");
  const [fechaCalendarioSel, setFechaCalendarioSel] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [descansosCalendario, setDescansosCalendario] = useState<Array<{ id: string; usuarioId: number; nombre: string; rol: string; fecha: string; hora: string; nota: string }>>([]);
  const [horaDescansoInput, setHoraDescansoInput] = useState<string>("12:30 PM - 1:30 PM");
  const [notaDescansoInput, setNotaDescansoInput] = useState<string>("Descanso del día");
  const [subFiltroCategoria, setSubFiltroCategoria] = useState<"todo" | "recoleccion" | "equipo">("todo");
  const [subFiltroFlujo, setSubFiltroFlujo] = useState<"todos" | "huertero" | "reciclador">("todos");

  const refrescarSolicitudesAdmin = async () => {
    try {
      const api = getApiUrl();
      const res = await fetch(`${api}/solicitudes`, {
        headers: { "rol-actor": "admin" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSolicitudes(data);
      }
    } catch {}
  };

  const usuarioIdActual = usuarioActual?.id ?? null;
  const usuarioRolActual = usuarioActual?.rol ?? null;

  useEffect(() => {
    if (!usuarioIdActual || !usuarioRolActual) return;
    if (usuarioRolActual === "admin") {
      // mantenido por seleccion del usuario
      setSubFiltroCategoria("todo");
      setSubFiltroFlujo("todos");
    }
  }, [usuarioIdActual, usuarioRolActual]);

  useEffect(() => {
    if (!usuarioIdActual || !usuarioRolActual) return;
    if (usuarioRolActual === "admin") {
      // mantenido por seleccion del usuario
      setSubFiltroCategoria("todo");
      setSubFiltroFlujo("todos");
    }
  }, [usuarioIdActual, usuarioRolActual]);

  const [loginUser, setLoginUser] = useState<string>("");
  const [loginPass, setLoginPass] = useState<string>("");
  const [errorAcceso, setErrorAcceso] = useState<string>("");

  const [regNombre, setRegNombre] = useState<string>("");
  const [regUsername, setRegUsername] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regTelefono, setRegTelefono] = useState<string>("");
  const [regDireccion, setRegDireccion] = useState<string>("");
  const [regSector, setRegSector] = useState<string>("Villas de San Pablo");
  const [regRol, setRegRol] = useState<string>("huertero");
  const [regVehiculo, setRegVehiculo] = useState<string>("");
  const [regRequerimientos, setRegRequerimientos] = useState<string>("");

  const [nombreManual, setNombreManual] = useState<string>("");
  const [flujo, setFlujo] = useState<"organico" | "reciclable">("organico");
  const [direccionManual, setDireccionManual] = useState<string>("");
  const [telefonoManual, setTelefonoManual] = useState<string>("");
  const [horario, setHorario] = useState<string>("Mañana (8:00 AM - 12:00 PM)");
  const [observacionVoz, setObservacionVoz] = useState<string>("");
  const [ubicacionGps, setUbicacionGps] = useState<string>("");
  const [grabandoCampo, setGrabandoCampo] = useState<"direccion" | "nota" | null>(null);
  const [mensajeSistema, setMensajeSistema] = useState<string>("");
  useEffect(() => {
    if (mensajeSistema && mensajeSistema.trim().length > 0) {
      hablar(mensajeSistema); // auto-lectura
    }
  }, [mensajeSistema]);
  const [linkWaDirecto, setLinkWaDirecto] = useState<string>("");
  const [linkWaSecundario, setLinkWaSecundario] = useState<string>("");

  const [chatTelefono, setChatTelefono] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistorial, setChatHistorial] = useState<MensajeChat[]>([
    {
      emisor: "bot",
      texto:
        "🌱 ¡Hola! Soy Camilo, el chatbot 24/7 de EcoConecta Villas de San Pablo. Escribe Hola para iniciar tu solicitud (flujo: 1/2 -> cantidad -> dirección/sector -> fecha -> horario -> nombre, o 4 para ver historial).",
    },
  ]);

  // Registro manual por el coordinador de audios/mensajes recibidos en WhatsApp Business
  const [mostrarFormAudioCoord, setMostrarFormAudioCoord] = useState<boolean>(false);
  const [audioVecinoNombre, setAudioVecinoNombre] = useState<string>("");
  const [audioVecinoTel, setAudioVecinoTel] = useState<string>("");
  const [audioVecinoDir, setAudioVecinoDir] = useState<string>("");
  const [audioCanalMedio, setAudioCanalMedio] = useState<string>("whatsapp_audio");
  const [audioResumenEscuchado, setAudioResumenEscuchado] = useState<string>("");
  const [audioHorario, setAudioHorario] = useState<string>("Mañana (8:00 AM - 12:00 PM)");

  const [recolectorSel, setRecolectorSel] = useState<Record<number, number>>({});
  const [fechaSel, setFechaSel] = useState<Record<number, string>>({});
  const [horaSel, setHoraSel] = useState<Record<number, string>>({});
  const [editandoSolId, setEditandoSolId] = useState<number | null>(null);
  const [editSolNombre, setEditSolNombre] = useState<string>("");
  const [editSolDir, setEditSolDir] = useState<string>("");
  const [editSolTel, setEditSolTel] = useState<string>("");
  const [editSolHorario, setEditSolHorario] = useState<string>("");
  const [editSolEstado, setEditSolEstado] = useState<string>("recibida");

  const [editandoUserId, setEditandoUserId] = useState<number | null>(null);
  const [editUserNombre, setEditUserNombre] = useState<string>("");
  const [editUserUsername, setEditUserUsername] = useState<string>("");
  const [editUserPass, setEditUserPass] = useState<string>("");
  const [editUserTel, setEditUserTel] = useState<string>("");
  const [editUserDir, setEditUserDir] = useState<string>("");
  const [editUserRol, setEditUserRol] = useState<string>("");
  const [editUserVehiculo, setEditUserVehiculo] = useState<string>("");
  const [editUserReq, setEditUserReq] = useState<string>("");

  const [nuevoStaffNombre, setNuevoStaffNombre] = useState<string>("");
  const [nuevoStaffUser, setNuevoStaffUser] = useState<string>("");
  const [nuevoStaffPass, setNuevoStaffPass] = useState<string>("");
  const [nuevoStaffTel, setNuevoStaffTel] = useState<string>("");
  const [nuevoStaffDir, setNuevoStaffDir] = useState<string>("");
  const [nuevoStaffRol, setNuevoStaffRol] = useState<string>("huertero");
  const [nuevoStaffVehiculo, setNuevoStaffVehiculo] = useState<string>("");
  const [nuevoStaffReq, setNuevoStaffReq] = useState<string>("");

  const [puntosEdit, setPuntosEdit] = useState<Record<string, number>>({});
  const [nuevoTituloEdu, setNuevoTituloEdu] = useState<string>("");
  const [nuevoFlujoEdu, setNuevoFlujoEdu] = useState<string>("organico");
  const [nuevoTextoEdu, setNuevoTextoEdu] = useState<string>("");

  const DICCIONARIO_NUMEROS: Record<number, string> = (() => {
    const dict: Record<number, string> = {
      0: "cero", 1: "uno", 2: "dos", 3: "tres", 4: "cuatro",
      5: "cinco", 6: "seis", 7: "siete", 8: "ocho", 9: "nueve",
      10: "diez", 11: "once", 12: "doce", 13: "trece", 14: "catorce",
      15: "quince", 16: "diecis\u00e9is", 17: "diecisiete", 18: "dieciocho", 19: "diecinueve",
      20: "veinte", 21: "veintiuno", 22: "veintid\u00f3s", 23: "veintitr\u00e9s", 24: "veinticuatro",
      25: "veinticinco", 26: "veintis\u00e9is", 27: "veintisiete", 28: "veintiocho", 29: "veintinueve",
      30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta",
      70: "setenta", 80: "ochenta", 90: "noventa", 100: "cien",
      200: "doscientos", 300: "trescientos", 400: "cuatrocientos", 500: "quinientos",
      600: "seiscientos", 700: "setecientos", 800: "ochocientos", 900: "novecientos",
      1000: "mil", 2000: "dos mil", 3000: "tres mil",
    };

    const convertir = (n: number): string => {
      if (dict[n] !== undefined) return dict[n];
      if (n < 100) {
        const dec = Math.floor(n / 10) * 10;
        const uni = n % 10;
        return `${dict[dec]} y ${dict[uni]}`;
      }
      if (n < 200) {
        return `ciento ${convertir(n - 100)}`;
      }
      if (n < 1000) {
        const cen = Math.floor(n / 100) * 100;
        const resto = n % 100;
        return `${dict[cen]} ${convertir(resto)}`;
      }
      if (n < 2000) {
        return `mil ${convertir(n - 1000)}`;
      }
      return `dos mil ${convertir(n - 2000)}`;
    };

    for (let i = 0; i <= 3000; i++) {
      dict[i] = convertir(i);
    }
    return dict;
  })();

  const numeroAPalabras = (numStr: string): string => {
    const n = parseInt(numStr, 10);
    if (!isNaN(n) && n >= 0 && n <= 3000) {
      return DICCIONARIO_NUMEROS[n];
    }
    return numStr
      .split("")
      .map((d) => DICCIONARIO_NUMEROS[parseInt(d, 10)] ?? d)
      .join(", ");
  };

  const limpiarTextoParaVoz = (texto: string): string => {
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ];
    const digitosMenu: Record<string, string> = {
      "0": "cero", "1": "uno", "2": "dos", "3": "tres", "4": "cuatro",
      "5": "cinco", "6": "seis", "7": "siete", "8": "ocho", "9": "nueve",
      "\u2460": "uno", "\u2461": "dos", "\u2462": "tres", "\u2463": "cuatro", "\u2464": "cinco",
      "\u2776": "uno", "\u2777": "dos", "\u2778": "tres", "\u2779": "cuatro", "\u277A": "cinco",
    };

    return texto
      // 1. Convertir cualquier emoji numerico (normal o alterado) a "Opcion uno:", "Opcion dos:", etc.
      .replace(/([0-9])[\u0080-\uFFFF\uFE0E\uFE0F\u200D\u20E3]+/g, (_, d) => `Opci\u00f3n ${digitosMenu[d] || d}: `)
      .replace(/[\u2460-\u2464\u2776-\u277A]/g, (ch) => `Opci\u00f3n ${digitosMenu[ch] || ""}: `)
      .replace(/(?:^|[\r\n])\s*([1-4])\s*[.)\-:]\s+/g, (_, d) => ` Opci\u00f3n ${digitosMenu[d] || d}: `)
      // 2. Eliminar todos los demas emojis decorativos
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF\uFE0E\uFE0F\u200D\u20E3\uFFFD]/g, " ")
      // 3. Quitar asteriscos y flechas
      .replace(/[\*\u2022\u00B7]/g, " ")
      .replace(/->/g, ", luego ")
      // 4. Corregir expresiones de genero y 24/7 antes de procesar barras
      .replace(/\bvecino\/a\b/gi, "vecino o vecina")
      .replace(/\bvecinos\/as\b/gi, "vecinos o vecinas")
      .replace(/\bhuertero\/a\b/gi, "huertero o huertera")
      .replace(/\breciclador\/a\b/gi, "reciclador o recicladora")
      .replace(/\b24\s*\/\s*7\b/gi, "veinticuatro horas, los siete d\u00edas")
      .replace(/\b24\s*horas\b/gi, "veinticuatro horas")
      .replace(/\b1\/2\b/g, "uno o dos")
      // 5. Fechas completas YYYY-MM-DD o YYYY/MM/DD
      .replace(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g, (_, y, m, d) => {
        const mes = meses[parseInt(m, 10) - 1];
        const diaTxt = numeroAPalabras(d);
        const anioTxt = numeroAPalabras(y);
        return mes ? `${diaTxt} de ${mes} de ${anioTxt}` : `${diaTxt} del ${numeroAPalabras(m)} de ${anioTxt}`;
      })
      // 6. Fechas completas DD-MM-YYYY o DD/MM/YYYY
      .replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g, (_, d, m, y) => {
        const mes = meses[parseInt(m, 10) - 1];
        const diaTxt = numeroAPalabras(d);
        const anioTxt = numeroAPalabras(y);
        return mes ? `${diaTxt} de ${mes} de ${anioTxt}` : `${diaTxt} del ${numeroAPalabras(m)} de ${anioTxt}`;
      })
      // 7. Fechas cortas DD/MM o DD-MM
      .replace(/\b(\d{1,2})[-\/](\d{1,2})\b/g, (_, d, m) => {
        const dia = parseInt(d, 10);
        const mesNum = parseInt(m, 10);
        if (dia >= 1 && dia <= 31 && mesNum >= 1 && mesNum <= 12) {
          return `${numeroAPalabras(d)} de ${meses[mesNum - 1]}`;
        }
        return `${numeroAPalabras(d)}, ${numeroAPalabras(m)}`;
      })
      // 8. Reemplazar barras / restantes por "o"
      .replace(/\//g, " o ")
      // 9. Horarios AM / PM y horas
      .replace(/\b(\d{1,2}):00\s*AM\b/gi, (_, h) => `${numeroAPalabras(h)} de la ma\u00f1ana`)
      .replace(/\b(\d{1,2}):00\s*PM\b/gi, (_, h) => (parseInt(h, 10) === 12 ? "doce del mediod\u00eda" : `${numeroAPalabras(h)} de la tarde`))
      .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, min) =>
        min === "00" ? numeroAPalabras(h) : `${numeroAPalabras(h)} y ${numeroAPalabras(min)}`
      )
      .replace(/(\d+)\s*h\b/gi, (_, h) => `${numeroAPalabras(h)} horas`)
      // 10. Direcciones y casas con guion
      .replace(/\bMz\.?\s*(\d+)/gi, (_, n) => `manzana ${numeroAPalabras(n)}`)
      .replace(/\bCs\.?\s*(\d+)/gi, (_, n) => `casa ${numeroAPalabras(n)}`)
      .replace(/\bSec\.?\s*(\d+)/gi, (_, n) => `sector ${numeroAPalabras(n)}`)
      .replace(/\b(?:Cra|Kr)\.?\s*(\d+)/gi, (_, n) => `carrera ${numeroAPalabras(n)}`)
      .replace(/\b(?:Cll|Cl)\.?\s*(\d+)/gi, (_, n) => `calle ${numeroAPalabras(n)}`)
      .replace(/#\s*/g, "n\u00famero ")
      .replace(/(\d{1,4})\s*-\s*(\d{1,4})/g, (_, a, b) => `${numeroAPalabras(a)}, ${numeroAPalabras(b)}`)
      // 11. Telefonos largos digito por digito
      .replace(/\+57\s*/g, "m\u00e1s cincuenta y siete, ")
      .replace(/\b\d{7,12}\b/g, (num) =>
        num.split("").map((d) => DICCIONARIO_NUMEROS[parseInt(d, 10)] ?? d).join(", ")
      )
      // 12. Convertir TODOS los numeros restantes (0 a 3000) a palabras en espanol
      .replace(/(\d+)/g, (num) => numeroAPalabras(num))
      .replace(/\s+/g, " ")
      .trim();
  };

  const hablar = (texto: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!audioHabilitado) return;
    const textoLimpio = limpiarTextoParaVoz(texto);
    if (!textoLimpio) return;
    window.speechSynthesis.resume();

    const lanzarVoz = () => {
      const utter = new SpeechSynthesisUtterance(textoLimpio);
      const voces = window.speechSynthesis.getVoices();
      const vozEs =
        voces.find((v) => v.lang.toLowerCase().includes("es-co")) ||
        voces.find((v) => v.lang.toLowerCase().includes("es-mx")) ||
        voces.find((v) => v.lang.toLowerCase().includes("es-us")) ||
        voces.find((v) => v.lang.toLowerCase().includes("es-es")) ||
        voces.find((v) => v.lang.toLowerCase().startsWith("es"));
      if (vozEs) {
        utter.voice = vozEs;
        utter.lang = vozEs.lang;
      } else {
        utter.lang = "es-ES";
      }
      utter.rate = 0.93;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        lanzarVoz();
      };
      setTimeout(lanzarVoz, 120);
    } else {
      lanzarVoz();
    }
  };

  const construirEnlaceWaOficial = (mensajeCustom?: string): string => {
    if (!configWa.configurado || !configWa.numero_completo) return "";
    const tipoRes = flujo === "organico" ? "Residuos Orgánicos" : "Residuos Reciclables";
    const textoPredeterminado =
      mensajeCustom ||
      `Hola EcoConecta Villas de San Pablo, quiero solicitar la recolección de *${tipoRes}*.\n` +
        `• Nombre: ${nombreManual || ""}\n` +
        `• Dirección: ${direccionManual || ""}\n` +
        `• Horario preferido: ${horario}\n` +
        `(A continuación puedo enviar nota de voz, foto o mi ubicación).`;
    return `https://wa.me/${configWa.numero_completo}?text=${encodeURIComponent(textoPredeterminado)}`;
  };

  const abrirWhatsAppOficial = (mensajeCustom?: string) => {
    const url = construirEnlaceWaOficial(mensajeCustom);
    if (!url) {
      const msg = "El número oficial de WhatsApp Business (+57) aún no está configurado por el Administrador o Coordinador.";
      setMensajeSistema(msg);
      hablar(msg);
      return;
    }
    hablar("Abriendo WhatsApp Business oficial de EcoConecta.");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const cargarDatosPublicos = async () => {
    const api = getApiUrl();
    try {
      const [resC, resR, resW] = await Promise.all([
        fetch(`${api}/contenidos`),
        fetch(`${api}/reglas-puntos`),
        fetch(`${api}/configuracion/whatsapp`),
      ]);
      if (resC.ok) setContenidos(await resC.json());
      if (resR.ok) setReglasPuntos(await resR.json());
      if (resW.ok) {
        const cfg: ConfigWhatsApp = await resW.json();
        setConfigWa(cfg);
        setInputWaOficial(cfg.numero_local || "");
      }
    } catch (err) {
      console.error("Error cargando datos públicos:", err);
    }
  };

  const cargarDatosPrivados = async (userObj: Usuario, sincronizarInputWa = false) => {
    const api = getApiUrl();
    try {
      const [resU, resC, resR, resS, resW] = await Promise.all([
        fetch(`${api}/usuarios`),
        fetch(`${api}/contenidos`),
        fetch(`${api}/reglas-puntos`),
        fetch(`${api}/solicitudes`, {
          headers: { rol: userObj.rol, "usuario-id": String(userObj.id) },
        }),
        fetch(`${api}/configuracion/whatsapp`),
      ]);

      if (resU.ok) {
        const listaU: Usuario[] = await resU.json();
        setUsuarios(listaU);
        const fresco = listaU.find((x) => x.id === userObj.id) || userObj;
        setUsuarioActual(fresco);
      }
      if (resC.ok) setContenidos(await resC.json());
      if (resR.ok) {
        const reglas: ReglaPuntos[] = await resR.json();
        setReglasPuntos(reglas);
        const mapPts: Record<string, number> = {};
        reglas.forEach((r) => (mapPts[r.flujo] = r.puntos_base));
        setPuntosEdit((prev) => (Object.keys(prev).length ? prev : mapPts));
      }
      if (resS.ok) setSolicitudes(await resS.json());
      if (resW.ok) {
        const cfg: ConfigWhatsApp = await resW.json();
        setConfigWa(cfg);
        if (sincronizarInputWa) {
          setInputWaOficial(cfg.numero_local || "");
        }
      }
    } catch (err) {
      console.error("Error cargando datos privados:", err);
    }
  };

  useEffect(() => {
    cargarDatosPublicos();
  }, []);


  useEffect(() => {
    if (!usuarioIdActual || !usuarioRolActual) return;
    if (usuarioRolActual === "admin") {
      // mantenido por seleccion del usuario
      setSubFiltroCategoria("todo");
      setSubFiltroFlujo("todos");
    }
  }, [usuarioIdActual, usuarioRolActual]);

  useEffect(() => {
    if (!usuarioIdActual || !usuarioRolActual) return;
    if (usuarioRolActual === "admin") {
      // mantenido por seleccion del usuario
      setSubFiltroCategoria("todo");
      setSubFiltroFlujo("todos");
    }
  }, [usuarioIdActual, usuarioRolActual]);

  const guardarNumeroWhatsAppOficial = async (limpiar = false) => {
    if (!usuarioActual) return;
    const api = getApiUrl();
    const res = await fetch(`${api}/configuracion/whatsapp`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "rol-actor": usuarioActual.rol,
      },
      body: JSON.stringify({ numero: limpiar ? "" : inputWaOficial }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.detail || "No se pudo guardar el número de WhatsApp.";
      setMensajeSistema(msg);
      hablar(msg);
      return;
    }
    setConfigWa(data);
    setInputWaOficial(data.numero_local || "");
    const msg = data.configurado
      ? `Número oficial de WhatsApp Business guardado: +57 ${data.numero_local} (${data.enlace_base}).`
      : "Número oficial de WhatsApp Business eliminado.";
    setMensajeSistema(msg);
    hablar(msg);
  };

  const iniciarSesion = async () => {
    setErrorAcceso("");
    const u = loginUser.trim();
    const p = loginPass.trim();
    if (!u || !p) {
      const msg = "Ingresa tu usuario y contraseña.";
      setErrorAcceso(msg);
      hablar(msg);
      return;
    }
    const api = getApiUrl();
    const res = await fetch(`${api}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorAcceso(data.detail || "Usuario o contraseña incorrectos.");
      hablar(data.detail || "Usuario o contraseña incorrectos.");
      return;
    }
    setLoginUser("");
    setLoginPass("");
    setUsuarioActual(data);
    hablar(`Bienvenido ${data.nombre}`);
    await cargarDatosPrivados(data, true);
  };

  const registrarNuevoPerfil = async () => {
    setErrorAcceso("");
    setMensajeSistema("");
    if (!regNombre || !regUsername || !regPassword || !regTelefono || !regDireccion) {
      const msg = "Completa todos los campos obligatorios.";
      setErrorAcceso(msg);
      hablar(msg);
      return;
    }
    const api = getApiUrl();
    const res = await fetch(`${api}/usuarios/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: regNombre,
        username: regUsername,
        password: regPassword,
        telefono: regTelefono,
        direccion: regDireccion,
        sector_manzana: regSector,
        rol: regRol,
        vehiculo_herramienta: regVehiculo,
        requerimientos_operativos: regRequerimientos,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorAcceso(data.detail || "No se pudo crear el perfil.");
      hablar(data.detail || "No se pudo crear el perfil.");
      return;
    }
    const msg = `Perfil de ${data.nombre} registrado. Una vez el Administrador lo apruebe en la aplicación, recibirás tus tareas con ubicación, día y hora en tu WhatsApp ${data.telefono}.`;
    setMensajeSistema(msg);
    hablar(msg);
    setRegNombre("");
    setRegUsername("");
    setRegPassword("");
    setRegTelefono("");
    setRegDireccion("");
    setRegVehiculo("");
    setRegRequerimientos("");
    setVistaPublica("pedir");
  };

  const crearUsuarioDesdeStaff = async (rolCrear: string) => {
    if (!usuarioActual || !nuevoStaffNombre || !nuevoStaffUser || !nuevoStaffPass || !nuevoStaffTel || !nuevoStaffDir) {
      hablar("Completa todos los campos obligatorios del perfil.");
      return;
    }
    const api = getApiUrl();
    const res = await fetch(`${api}/usuarios/registro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "rol-actor": usuarioActual.rol,
      },
      body: JSON.stringify({
        nombre: nuevoStaffNombre,
        username: nuevoStaffUser,
        password: nuevoStaffPass,
        telefono: nuevoStaffTel,
        direccion: nuevoStaffDir,
        sector_manzana: "Villas de San Pablo",
        rol: rolCrear,
        vehiculo_herramienta: nuevoStaffVehiculo,
        requerimientos_operativos: nuevoStaffReq,
      }),
    });
    if (res.ok) {
      setNuevoStaffNombre("");
      setNuevoStaffUser("");
      setNuevoStaffPass("");
      setNuevoStaffTel("");
      setNuevoStaffDir("");
      setNuevoStaffVehiculo("");
      setNuevoStaffReq("");
      const msg = "Perfil creado y activado en la base de datos.";
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const dictarPorVoz = (destino: "direccion" | "nota") => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      hablar("Tu navegador no soporta micrófono, escribe el texto directamente.");
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = "es-CO";
    recognition.onstart = () => setGrabandoCampo(destino);
    recognition.onend = () => setGrabandoCampo(null);
    recognition.onresult = (event: any) => {
      const texto = event.results[0][0].transcript;
      if (destino === "direccion") setDireccionManual(texto);
      else setObservacionVoz(texto);
      hablar(`Capturado: ${texto}`);
    };
    recognition.start();
  };

  const obtenerGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      setUbicacionGps(coords);
      hablar("Ubicación GPS adjuntada.");
    });
  };

  const enviarSolicitud = async () => {
    if (!direccionManual.trim() || !telefonoManual.trim()) {
      hablar("Debes escribir tu dirección manual y el número de WhatsApp.");
      return;
    }
    const api = getApiUrl();
    const res = await fetch(`${api}/solicitudes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        solicitante_id: usuarioActual?.id || null,
        nombre_contacto: nombreManual.trim(),
        flujo,
        direccion_manual: direccionManual,
        telefono_manual: telefonoManual,
        descripcion: observacionVoz || `Entrega de residuos ${flujo}`,
        ubicacion_gps: ubicacionGps,
        disponibilidad_horaria: horario,
        canal_origen: "web",
      }),
    });
    if (res.ok) {
      const creada = await res.json();
      const enlaceOficial = configWa.configurado
        ? `https://wa.me/${configWa.numero_completo}?text=${encodeURIComponent(creada.mensaje_whatsapp)}`
        : "";
      setLinkWaDirecto(enlaceOficial);
      setLinkWaSecundario("");

      const msg = `Solicitud ${creada.codigo} guardada y enviada al Coordinador de ${
        flujo === "organico" ? "Huerteros" : "Recicladores"
      } para la dirección ${direccionManual}.`;
      setMensajeSistema(msg);
      hablar(msg);
      setObservacionVoz("");
    }
  };

  const registrarSolicitudDesdeAudioCoord = async () => {
    if (!usuarioActual) return;
    if (!audioVecinoDir.trim() || !audioVecinoTel.trim() || !audioResumenEscuchado.trim()) {
      hablar("Completa el teléfono del habitante, la dirección y el detalle escuchado en el audio.");
      return;
    }
    const flujoAsignado = usuarioActual.rol === "coord_huerteros" ? "organico" : "reciclable";
    const api = getApiUrl();
    const res = await fetch(`${api}/solicitudes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        solicitante_id: usuarioActual.id,
        nombre_contacto: audioVecinoNombre.trim() || "Habitante WhatsApp Business",
        flujo: flujoAsignado,
        direccion_manual: audioVecinoDir.trim(),
        telefono_manual: audioVecinoTel.trim(),
        descripcion: audioResumenEscuchado.trim(),
        ubicacion_gps: "",
        disponibilidad_horaria: audioHorario,
        canal_origen: audioCanalMedio,
      }),
    });
    if (res.ok) {
      const creada = await res.json();
      setAudioVecinoNombre("");
      setAudioVecinoTel("");
      setAudioVecinoDir("");
      setAudioResumenEscuchado("");
      setMostrarFormAudioCoord(false);
      const msg = `Solicitud ${creada.codigo} registrada manualmente desde WhatsApp Business en tu bandeja.`;
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const enviarMensajeChatbot = async (textoForzado?: string) => {
    const textoEnviar = (textoForzado ?? chatInput).trim();
    if (!textoEnviar) return;
    if (!chatTelefono.trim()) {
      hablar("Escribe primero tu número de WhatsApp arriba del chat.");
      return;
    }
    const nuevoHist: MensajeChat[] = [...chatHistorial, { emisor: "usuario", texto: textoEnviar }];
    setChatHistorial(nuevoHist);
    setChatInput("");

    const api = getApiUrl();
    const res = await fetch(`${api}/chatbot/simular`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono: chatTelefono, mensaje: textoEnviar }),
    });
    if (res.ok) {
      const data = await res.json();
      setChatHistorial([...nuevoHist, { emisor: "bot", texto: data.respuesta }]);
      hablar(data.respuesta);
      if (data.solicitud_creada) {
        const msg = `Solicitud ${data.solicitud_creada.codigo} creada y enviada a la bandeja del Coordinador.`;
        setMensajeSistema(msg);
        if (usuarioActual) cargarDatosPrivados(usuarioActual, false);
      }
    }
  };

  const programarSolicitud = async (solId: number) => {
    if (!usuarioActual) {
      const m = "Inicia sesión primero para programar la recolección.";
      setMensajeSistema(m);
      hablar(m);
      return;
    }
    const solActual = solicitudes.find((x) => x.id === solId);
    const recId = recolectorSel[solId] || solActual?.recolector_id;
    const fecha = fechaSel[solId] || solActual?.fecha_programada || new Date().toISOString().slice(0, 10);
    const hora = (horaSel[solId] || solActual?.hora_programada || solActual?.disponibilidad_horaria || "").trim();
    const normalizarHora = (h: string) => h.trim().toLowerCase().replace(/\s+/g, "");
    const normalizarFecha = (f: string) => f.trim();
    const conflicto = solicitudes.find(
      (x) =>
        x.id !== solId &&
        x.estado !== "cancelada" &&
        Number(x.recolector_id) === Number(recId) &&
        normalizarFecha(String(x.fecha_programada || "")) === normalizarFecha(String(fecha)) &&
        normalizarHora(String(x.hora_programada || "")) === normalizarHora(String(hora)) &&
        normalizarHora(String(hora)) !== ""
    );
    if (conflicto) {
      const encargadoNombre = usuarios.find((u) => Number(u.id) === Number(recId))?.nombre || "este encargado";
      const msgConflicto = `No es posible agendar a ${encargadoNombre} el ${fecha} a las ${hora}; ya tiene una visita programada en ese mismo día y hora. Elige otro horario o a otro integrante.`;
      setMensajeSistema(msgConflicto);
      hablar(msgConflicto);
      return;
    }

    if (!recId || !fecha || !hora) {
      const m = "Selecciona el encargado aprobado, el día y la hora.";
      setMensajeSistema(m);
      hablar(m);
      return;
    }

    const msgEspera = "Enviando programación al servidor, por favor espera un momento.";
    setMensajeSistema(msgEspera);
    hablar(msgEspera);

    try {
      const api = getApiUrl();
      const res = await fetch(`${api}/solicitudes/${solId}/programar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "rol-actor": usuarioActual.rol,
        },
        body: JSON.stringify({
          coordinador_id: usuarioActual.id,
          recolector_id: Number(recId),
          fecha_programada: fecha,
          hora_programada: hora,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.tel_recolector) {
          setLinkWaDirecto(`https://wa.me/${data.tel_recolector}?text=${encodeURIComponent(data.msg_recolector || "")}`);
        }
        if (data.tel_vecino) {
          setLinkWaSecundario(`https://wa.me/${data.tel_vecino}?text=${encodeURIComponent(data.msg_vecino || "")}`);
        }
        const msg = "Tarea programada. Ya puedes abrir WhatsApp Business para enviar la ubicación, día y hora.";
        setMensajeSistema(msg);
        hablar(msg);
        await cargarDatosPrivados(usuarioActual, false);
      } else {
        const errMsg = data.detail || `No se pudo programar (código ${res.status}).`;
        setMensajeSistema(errMsg);
        hablar(errMsg);
      }
    } catch (e: any) {
      const netMsg = "Error de conexión con el servidor al programar. Verifica que el backend esté activo.";
      setMensajeSistema(netMsg);
      hablar(netMsg);
    }
    };

  const guardarEdicionSolicitud = async (solId: number) => {
    if (!usuarioActual) return;
    const api = getApiUrl();
    const res = await fetch(`${api}/solicitudes/${solId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "usuario-id": String(usuarioActual.id),
        "rol-actor": usuarioActual.rol,
      },
      body: JSON.stringify({
        nombre_contacto: editSolNombre,
        direccion_entrega: editSolDir,
        telefono_contacto: editSolTel,
        disponibilidad_horaria: editSolHorario,
        estado: editSolEstado,
      }),
    });
    if (res.ok) {
      setEditandoSolId(null);
      const msg = "Solicitud actualizada por el Coordinador.";
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const eliminarSolicitud = async (solId: number) => {
    if (!usuarioActual) return;
    const api = getApiUrl();
    const res = await fetch(`${api}/solicitudes/${solId}`, {
      method: "DELETE",
      headers: { "rol-actor": usuarioActual.rol },
    });
    if (res.ok) {
      const msg = "Solicitud eliminada.";
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const cerrarRecoleccion = async (solId: number) => {
    if (!usuarioActual) return;
    const api = getApiUrl();
    const res = await fetch(`${api}/solicitudes/${solId}/cerrar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recolector_id: usuarioActual.id,
        nota_cierre: "Recolección confirmada en sitio.",
      }),
    });
    if (res.ok) {
      const msg = "Recolección confirmada en el sistema.";
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const abrirEditorUsuario = (u: Usuario) => {
    if (editandoUserId === u.id) {
      setEditandoUserId(null);
      return;
    }
    setEditandoUserId(u.id);
    setEditUserNombre(u.nombre);
    setEditUserUsername(u.username);
    setEditUserPass("");
    setEditUserTel(u.telefono);
    setEditUserDir(u.direccion);
    setEditUserRol(u.rol);
    setEditUserVehiculo(u.vehiculo_herramienta || "");
    setEditUserReq(u.requerimientos_operativos || "");
    hablar(`Editando perfil de ${u.nombre}`);
  };

  const aprobarOEditarUsuario = async (u: Usuario, aprobarAhora?: boolean) => {
    if (!usuarioActual) return;
    const api = getApiUrl();
    const esEdicion = editandoUserId === u.id;
    const payload = {
      nombre: esEdicion ? editUserNombre : u.nombre,
      username: esEdicion ? editUserUsername : u.username,
      password: esEdicion && editUserPass ? editUserPass : undefined,
      telefono: esEdicion ? editUserTel : u.telefono,
      direccion: esEdicion ? editUserDir : u.direccion,
      sector_manzana: u.sector_manzana,
      rol: esEdicion ? editUserRol : u.rol,
      vehiculo_herramienta: esEdicion ? editUserVehiculo : u.vehiculo_herramienta,
      requerimientos_operativos: esEdicion ? editUserReq : u.requerimientos_operativos,
      aprobado: aprobarAhora !== undefined ? aprobarAhora : u.aprobado,
    };
    const res = await fetch(`${api}/usuarios/${u.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "rol-actor": usuarioActual.rol,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditandoUserId(null);
      if (aprobarAhora === true && u.telefono) {
        const msgWa = `✅ EcoConecta Villas de San Pablo: ¡Hola ${u.nombre}! Tu perfil (${u.rol}) fue APROBADO por el Administrador. Ya estás habilitado para recibir tareas asignadas por WhatsApp Business.`;
        setLinkWaDirecto(`https://wa.me/${u.telefono}?text=${encodeURIComponent(msgWa)}`);
        setLinkWaSecundario("");
      }
      const msg =
        aprobarAhora === true
          ? `Perfil de ${u.nombre} aprobado. Puedes avisarle directamente por WhatsApp Business.`
          : `Perfil de ${u.nombre} actualizado.`;
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const eliminarUsuario = async (u: Usuario) => {
    if (!usuarioActual) return;
    const api = getApiUrl();
    const res = await fetch(`${api}/usuarios/${u.id}`, {
      method: "DELETE",
      headers: { "rol-actor": usuarioActual.rol },
    });
    if (res.ok) {
      const msg = `Perfil de ${u.nombre} eliminado.`;
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const verHistorial = async (solId: number) => {
    if (historialAbierto[solId]) {
      const copia = { ...historialAbierto };
      delete copia[solId];
      setHistorialAbierto(copia);
      return;
    }
    const api = getApiUrl();
    const res = await fetch(`${api}/solicitudes/${solId}/historial`);
    const items: HistorialItem[] = await res.json();
    setHistorialAbierto({ ...historialAbierto, [solId]: items });
    hablar("Mostrando historial de trazabilidad.");
  };

  const guardarReglaPuntos = async (regla: ReglaPuntos) => {
    if (!usuarioActual) return;
    const api = getApiUrl();
    const nuevosPts = puntosEdit[regla.flujo] ?? regla.puntos_base;
    const res = await fetch(`${api}/reglas-puntos/${regla.flujo}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "rol-actor": usuarioActual.rol,
      },
      body: JSON.stringify({ puntos_base: nuevosPts, descripcion: regla.descripcion }),
    });
    if (res.ok) {
      const msg = `Puntos actualizados a ${nuevosPts}.`;
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const crearContenidoEducativo = async () => {
    if (!usuarioActual || !nuevoTituloEdu || !nuevoTextoEdu) return;
    const api = getApiUrl();
    const res = await fetch(`${api}/contenidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "rol-actor": usuarioActual.rol,
      },
      body: JSON.stringify({
        titulo: nuevoTituloEdu,
        flujo: nuevoFlujoEdu,
        icono: nuevoFlujoEdu === "organico" ? "🌱" : "♻️",
        texto_visual: nuevoTextoEdu,
        guion_audio: `${nuevoTituloEdu}. ${nuevoTextoEdu}`,
      }),
    });
    if (res.ok) {
      setNuevoTituloEdu("");
      setNuevoTextoEdu("");
      const msg = "Guía educativa publicada.";
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    }
  };

  const BotonAccesible = ({
    idBoton,
    textoVisual,
    subtextoVisual,
    textoAudio,
    icono,
    colorClase,
    activo,
    onEjecutar,
  }: {
    idBoton: string;
    textoVisual: string;
    subtextoVisual?: string;
    textoAudio: string;
    icono: string;
    colorClase: string;
    activo?: boolean;
    onEjecutar: () => void;
  }) => {
    const listo = modoEscucharPrimero && preseleccionado === idBoton;
    const tocar = () => {
      if (modoEscucharPrimero && !listo) {
        hablar(`${textoAudio}. Toca otra vez para confirmar.`);
        setPreseleccionado(idBoton);
        return;
      }
      hablar(textoAudio);
      setPreseleccionado(null);
      onEjecutar();
    };
    return (
      <div
        onClick={tocar}
        role="button"
        tabIndex={0}
        className={`cursor-pointer select-none rounded-2xl p-4 border-2 transition-all flex items-center justify-between gap-3 shadow-sm ${colorClase} ${
          activo ? "ring-4 ring-amber-400" : ""
        } ${listo ? "ring-4 ring-orange-500 animate-pulse" : ""}`}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-3xl">{icono}</span>
          <div>
            <p className="font-extrabold text-base leading-tight">{textoVisual}</p>
            {subtextoVisual && <p className="text-xs opacity-90 mt-1">{subtextoVisual}</p>}
            {listo && (
              <span className="inline-block mt-1 text-xs font-black bg-orange-600 text-white px-2 py-0.5 rounded-full">
                TOCA OTRA VEZ PARA CONFIRMAR
              </span>
            )}
          </div>
        </div>
        {audioHabilitado && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hablar(textoAudio);
            }}
            className="w-11 h-11 rounded-full bg-black/15 flex items-center justify-center text-xl flex-shrink-0"
          >
            🔊
          </button>
        )}
      </div>
    );
  };

  const renderTarjetaConfigWhatsApp = () => (
    <div className="bg-white p-4 rounded-2xl border-2 border-green-600 flex flex-col gap-2.5">
      <h3 className="font-black text-sm">📱 Configuración Número Oficial WhatsApp Business (+57)</h3>
      <p className="text-xs text-stone-600">
        Ingresa el número oficial de WhatsApp Business de EcoConecta (solo los 10 dígitos de Colombia; el indicativo <strong>+57</strong> se incluye automáticamente).
      </p>
      <div className="flex items-center gap-2">
        <span className="px-3 py-2.5 rounded-xl bg-green-100 border-2 border-green-600 font-black text-sm text-green-950">
          +57
        </span>
        <input
          type="tel"
          maxLength={12}
          value={inputWaOficial}
          onChange={(e) => setInputWaOficial(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="Número celular de 10 dígitos"
          className="flex-1 p-2.5 rounded-xl border-2 border-stone-300 font-bold text-sm"
        />
      </div>

      <div className="bg-stone-50 p-2.5 rounded-xl border text-xs">
        <span className="font-bold text-stone-600">Enlace dinámico generado: </span>
        {configWa.configurado ? (
          <a
            href={configWa.enlace_base}
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-green-700 underline break-all"
          >
            {configWa.enlace_base}
          </a>
        ) : (
          <span className="text-amber-800 font-bold">Sin número configurado todavía</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => guardarNumeroWhatsAppOficial(false)}
          className="flex-1 bg-green-700 hover:bg-green-800 text-white font-extrabold py-2 rounded-xl text-xs"
        >
          Guardar Número Oficial
        </button>
        {configWa.configurado && (
          <button
            type="button"
            onClick={() => guardarNumeroWhatsAppOficial(true)}
            className="bg-red-100 text-red-900 font-bold px-3 py-2 rounded-xl text-xs"
          >
            Borrar
          </button>
        )}
      </div>
    </div>
  );

  const renderTarjetaWhatsAppBusinessPublica = () => (
    <div className="bg-green-50 border-2 border-green-600 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">🎙️</span>
        <div>
          <h3 className="font-black text-base text-green-950">
            WhatsApp Business Oficial • Audios, Fotos, Texto y Ubicación
          </h3>
          <p className="text-xs text-stone-800 mt-1 leading-relaxed">
            Puedes comunicarte directamente con el equipo de EcoConecta por <strong>WhatsApp Business</strong> enviando:
          </p>
          <ul className="text-xs text-stone-800 mt-1.5 space-y-1 font-semibold">
            <li>🎙️ <strong>Notas de voz / audios</strong> describiendo qué residuos vas a entregar y en qué horario.</li>
            <li>💬 <strong>Mensajes escritos</strong> con tu dirección o manzana y casa.</li>
            <li>📸 <strong>Fotografías</strong> de los residuos orgánicos o reciclables separados.</li>
            <li>📍 <strong>Ubicación compartida</strong> desde tu celular.</li>
          </ul>
          <p className="text-[11px] text-green-900 mt-2 bg-white/80 p-2 rounded-xl border border-green-300">
            ℹ️ Nuestro equipo escucha tus audios y revisa tus mensajes directamente en <strong>WhatsApp Business</strong> para registrar y programar tu recolección en el panel.
          </p>
        </div>
      </div>

      {configWa.configurado ? (
        <div className="flex flex-col gap-1.5">
          <BotonAccesible
            idBoton="btn_wa_oficial_directo"
            textoVisual={`ABRIR WHATSAPP BUSINESS (+57 ${configWa.numero_local})`}
            subtextoVisual="Abre el chat con mensaje predeterminado para pedir recolección o enviar audio"
            textoAudio="Abrir WhatsApp Business oficial de EcoConecta con mensaje predeterminado."
            icono="📲"
            colorClase="bg-green-600 text-white border-green-950"
            onEjecutar={() => abrirWhatsAppOficial()}
          />
          <p className="text-[11px] text-center text-stone-600">
            Enlace directo: <span className="font-mono font-bold">{configWa.enlace_base}</span>
          </p>
        </div>
      ) : (
        <div className="bg-amber-100 border border-amber-400 text-amber-950 p-3 rounded-xl text-xs font-bold">
          ⚠️ El número oficial de WhatsApp Business (+57) aún no ha sido configurado en el panel de Administración o Coordinación.
        </div>
      )}
    </div>
  );

  const renderChatbotBox = () => (
    <div className="flex flex-col gap-3">
      {renderTarjetaWhatsAppBusinessPublica()}

      <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-3">
        <div>
          <h3 className="font-black text-sm">💬 Asistente Guiado Rápido (Registro por pasos)</h3>
          <p className="text-xs text-stone-600">
            Si prefieres dejar tu solicitud escrita paso a paso desde esta pantalla:
          </p>
        </div>

        <div className="bg-stone-50 p-2.5 rounded-xl border flex items-center gap-2">
          <span className="text-xs font-black whitespace-nowrap">Tu WhatsApp (+57):</span>
          <input
            type="tel"
            value={chatTelefono}
            onChange={(e) => setChatTelefono(e.target.value)}
            placeholder="Escribe tu número de WhatsApp"
            className="flex-1 p-2 border rounded-lg text-sm font-bold bg-white"
          />
        </div>

        <div className="bg-[#efeae2] p-3 rounded-2xl border border-stone-300 flex flex-col gap-2 max-h-60 overflow-y-auto">
          {chatHistorial.map((m, i) => (
            <div
              key={i}
              onClick={() => hablar(m.texto)}
              className={`cursor-pointer p-2.5 rounded-2xl text-xs whitespace-pre-line max-w-[85%] shadow-sm ${
                m.emisor === "usuario" ? "bg-[#d9fdd3] self-end" : "bg-white self-start"
              }`}
            >
              {m.texto}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Hola", val: "Hola", audio: "Enviar Hola" },
            { label: "1️⃣ Orgánicos", val: "1", audio: "Elegir opción 1, Residuos Orgánicos" },
            { label: "2️⃣ Reciclables", val: "2", audio: "Elegir opción 2, Residuos Reciclables" },
            { label: "☀️ Mañana (1)", val: "1", audio: "Elegir horario de la mañana" },
            { label: "🌤️ Tarde (2)", val: "2", audio: "Elegir horario de la tarde" },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                hablar(c.audio);
                enviarMensajeChatbot(c.val);
              }}
              className="bg-white border border-green-600 text-green-900 font-bold text-xs px-2.5 py-1 rounded-full"
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensajeChatbot()}
            placeholder="Escribe tu dirección, nombre o respuesta..."
            className="flex-1 p-2.5 rounded-xl border-2 border-stone-300 bg-white text-sm"
          />
          <button
            type="button"
            onClick={() => enviarMensajeChatbot()}
            className="bg-green-700 text-white font-extrabold px-4 rounded-xl text-sm"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );

  const esCoordinador =
    usuarioActual?.rol === "coord_huerteros" || usuarioActual?.rol === "coord_recicladores";
  const esRecolector =
    usuarioActual?.rol === "huertero" || usuarioActual?.rol === "reciclador";
  const esAdmin = usuarioActual?.rol === "admin";

  const flujoCoord = usuarioActual?.rol === "coord_huerteros" ? "organico" : "reciclable";
  const rolEquipoCoord = usuarioActual?.rol === "coord_huerteros" ? "huertero" : "reciclador";

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900 pb-20">
      <header className="bg-emerald-800 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div
            onClick={() => {
              hablar("EcoConecta Villas de San Pablo");
              if (!usuarioActual) setVistaPublica("pedir");
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">🌱</span>
            <div>
              <h1 className="font-black text-lg leading-tight">EcoConecta</h1>
              <p className="text-[11px] text-emerald-200">
                {usuarioActual
                  ? `${usuarioActual.nombre} • ${usuarioActual.rol}`
                  : "Villas de San Pablo • Barranquilla"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const next = !audioHabilitado;
                setAudioHabilitado(next);
                if (!next && typeof window !== "undefined") {
                  window.speechSynthesis.cancel();
                } else if (next) {
                  setTimeout(() => hablar("Audio activado"), 80);
                }
              }}
              className={`px-3 py-2 rounded-xl font-extrabold text-xs ${
                audioHabilitado ? "bg-emerald-600 text-white" : "bg-stone-900 text-amber-300"
              }`}
            >
              {audioHabilitado ? "🔊 Audio: SÍ" : "🔇 Sin Audio"}
            </button>

            {audioHabilitado && (
              <button
                type="button"
                onClick={() => {
                  const next = !modoEscucharPrimero;
                  setModoEscucharPrimero(next);
                  hablar(next ? "Modo escuchar primero activado" : "Modo toque directo activado");
                }}
                className={`px-2.5 py-2 rounded-xl font-extrabold text-xs ${
                  modoEscucharPrimero ? "bg-amber-400 text-stone-950" : "bg-emerald-700 text-white"
                }`}
              >
                {modoEscucharPrimero ? "👂 2 Toques" : "👆 Directo"}
              </button>
            )}

            {usuarioActual && (
              <button
                type="button"
                onClick={() => {
                  hablar("Cerrando sesión");
                  setUsuarioActual(null);
                  setMensajeSistema("");
                  setLinkWaDirecto("");
                  setLinkWaSecundario("");
                  setVistaPublica("pedir");
                }}
                className="px-3 py-2 rounded-xl bg-red-600 text-white font-extrabold text-xs"
              >
                Salir
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
        {mensajeSistema && (
          <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-950 p-3.5 rounded-2xl font-bold text-sm flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span>✅ {mensajeSistema}</span>
              <button
                type="button"
                onClick={() => {
                  setMensajeSistema("");
                  setLinkWaDirecto("");
                  setLinkWaSecundario("");
                }}
                className="text-xs font-black px-2 py-1 bg-emerald-200 rounded-lg"
              >
                Cerrar
              </button>
            </div>
            {linkWaDirecto && (
              <a
                href={linkWaDirecto}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => hablar("Abriendo WhatsApp Business")}
                className="inline-block text-center bg-green-600 text-white font-extrabold py-2 px-3 rounded-xl text-xs"
              >
                📲 Abrir WhatsApp Business (Enviar mensaje)
              </a>
            )}
            {linkWaSecundario && (
              <a
                href={linkWaSecundario}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => hablar("Abriendo WhatsApp Business para el vecino")}
                className="inline-block text-center bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs"
              >
                📲 Abrir WhatsApp Business (Confirmar al Habitante)
              </a>
            )}
          </div>
        )}

        {!usuarioActual && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "pedir", icon: "🚛", label: "Pedir Recolección", audio: "Pedir recolección de residuos" },
                { id: "aprender", icon: "♻️", label: "Aprender", audio: "Aprender a separar residuos" },
                { id: "whatsapp", icon: "🎙️", label: "WhatsApp y Audios", audio: "WhatsApp Business y envío de notas de voz" },
                { id: "registro", icon: "📝", label: "Crear Perfil", audio: "Crear perfil de huertero o reciclador" },
                { id: "login", icon: "🔐", label: "Coordinadores", audio: "Ingreso de coordinadores y administrador" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    hablar(tab.audio);
                    setErrorAcceso("");
                    setVistaPublica(tab.id as any);
                  }}
                  className={`p-3 rounded-2xl font-extrabold flex flex-col items-center gap-1 border-2 transition-all ${
                    vistaPublica === tab.id
                      ? "bg-emerald-700 text-white border-emerald-950 shadow-sm"
                      : "bg-white text-stone-800 border-stone-300"
                  }`}
                >
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="text-xs text-center leading-tight">{tab.label}</span>
                </button>
              ))}
            </div>

            {vistaPublica === "pedir" && (
              <section className="flex flex-col gap-4">
                {renderTarjetaWhatsAppBusinessPublica()}

                <h2 className="font-black text-base">O registra tu solicitud directamente aquí:</h2>
                <BotonAccesible
                  idBoton="sel_org"
                  textoVisual="Residuos Orgánicos"
                  subtextoVisual="Cáscaras y comida -> Llega al Coordinador de Huerteros"
                  textoAudio="Residuos orgánicos. Llega al coordinador de huerteros."
                  icono="🍌"
                  colorClase="bg-green-50 border-green-600"
                  activo={flujo === "organico"}
                  onEjecutar={() => setFlujo("organico")}
                />
                <BotonAccesible
                  idBoton="sel_rec"
                  textoVisual="Residuos Reciclables"
                  subtextoVisual="Botellas, cartón y latas -> Llega al Coordinador de Recicladores"
                  textoAudio="Residuos reciclables. Llega al coordinador de recicladores."
                  icono="📦"
                  colorClase="bg-sky-50 border-sky-600"
                  activo={flujo === "reciclable"}
                  onEjecutar={() => setFlujo("reciclable")}
                />

                <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
                  <label className="font-black text-sm">2. Tu nombre (Hogar o Comercio)</label>
                  <input
                    type="text"
                    value={nombreManual}
                    onFocus={() => hablar("Escribe tu nombre")}
                    onChange={(e) => setNombreManual(e.target.value)}
                    placeholder="Escribe tu nombre completo"
                    className="p-3 rounded-xl border-2 border-stone-300 font-semibold text-sm"
                  />
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
                  <label className="font-black text-sm">3. Dirección manual donde recogemos *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={direccionManual}
                      onFocus={() => hablar("Escribe tu dirección manual")}
                      onChange={(e) => setDireccionManual(e.target.value)}
                      placeholder="Escribe tu dirección exacta (Manzana, Casa, Barrio)"
                      className="flex-1 p-3 rounded-xl border-2 border-stone-300 font-semibold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => dictarPorVoz("direccion")}
                      className={`px-3 rounded-xl text-xl border-2 ${
                        grabandoCampo === "direccion" ? "bg-red-500 text-white animate-pulse" : "bg-amber-100"
                      }`}
                    >
                      🎤
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={obtenerGps}
                    className="text-xs font-bold text-emerald-800 underline text-left"
                  >
                    📍 {ubicacionGps ? `GPS adjunto: ${ubicacionGps}` : "Adjuntar también coordenadas GPS"}
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-green-600 flex flex-col gap-2">
                  <label className="font-black text-sm">4. Tu número de WhatsApp (+57) *</label>
                  <input
                    type="tel"
                    value={telefonoManual}
                    onFocus={() => hablar("Escribe tu número de WhatsApp")}
                    onChange={(e) => setTelefonoManual(e.target.value)}
                    placeholder="Escribe tu número de WhatsApp"
                    className="p-3 rounded-xl border-2 border-stone-300 font-bold text-sm"
                  />
                </div>

                <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
                  <label className="font-black text-sm">5. Horario preferido</label>
                  <select
                    value={horario}
                    onChange={(e) => {
                      setHorario(e.target.value);
                      hablar(`Horario seleccionado: ${e.target.value}`);
                    }}
                    className="p-3 rounded-xl border-2 border-stone-300 font-bold text-sm bg-white"
                  >
                    <option value="Mañana (8:00 AM - 12:00 PM)">☀️ En la Mañana (8:00 AM - 12:00 PM)</option>
                    <option value="Tarde (2:00 PM - 5:00 PM)">🌤️ En la Tarde (2:00 PM - 5:00 PM)</option>
                  </select>
                  <input
                    type="text"
                    value={observacionVoz}
                    onChange={(e) => setObservacionVoz(e.target.value)}
                    placeholder="Descripción de los residuos a entregar"
                    className="p-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <BotonAccesible
                  idBoton="btn_enviar_publico"
                  textoVisual="REGISTRAR SOLICITUD EN ECOCONECTA"
                  subtextoVisual={`Llega directo al Coordinador de ${flujo === "organico" ? "Huerteros" : "Recicladores"}`}
                  textoAudio="Registrar solicitud en EcoConecta."
                  icono="✅"
                  colorClase="bg-emerald-600 text-white border-emerald-950"
                  onEjecutar={enviarSolicitud}
                />
              </section>
            )}

            {vistaPublica === "aprender" && (
              <section className="flex flex-col gap-3">
                <h2 className="font-black text-lg">Toca cada tarjeta para escuchar cómo separar</h2>
                {contenidos.map((c) => (
                  <BotonAccesible
                    key={c.id}
                    idBoton={`edu_${c.id}`}
                    textoVisual={c.titulo}
                    subtextoVisual={c.texto_visual}
                    textoAudio={c.guion_audio}
                    icono={c.icono}
                    colorClase={c.flujo === "organico" ? "bg-green-50 border-green-500" : "bg-sky-50 border-sky-500"}
                    onEjecutar={() => {}}
                  />
                ))}
              </section>
            )}

            {vistaPublica === "whatsapp" && renderChatbotBox()}

            {vistaPublica === "registro" && (
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-600 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between gap-2"><h2 className="font-black text-lg">Registro de Huerteros y Recicladores</h2><button type="button" onClick={() => hablar("Registro de Huerteros y Recicladores. Selecciona si eres huertero o reciclador y llena cada casilla para enviar tu perfil al administrador.")} className="bg-emerald-100 text-emerald-950 font-extrabold text-xs px-3 py-2 rounded-xl border border-emerald-600">🔊 Escuchar guía</button></div>
                <p className="text-xs text-stone-600">
                  Ingresa tu número de WhatsApp y todos tus requerimientos. Cuando el Administrador apruebe tu perfil en la app, recibirás tus tareas con ubicación, día y hora asignados por WhatsApp Business.
                </p>

                {errorAcceso && (
                  <div className="bg-red-100 border-2 border-red-500 text-red-900 p-3 rounded-xl text-sm font-bold">
                    ⚠️ {errorAcceso}
                  </div>
                )}

                <label className="text-xs font-extrabold">Selecciona tu perfil *</label>
                <select
                  value={regRol} onFocus={() => hablar("Selecciona tu perfil: huertero para residuos orgánicos o reciclador para reciclables")}
                  onChange={(e) => {
                    setRegRol(e.target.value);
                    hablar(e.target.value === "huertero" ? "Perfil Huertero" : "Perfil Reciclador");
                  }}
                  className="p-3 rounded-xl border-2 border-stone-300 font-bold text-sm bg-white"
                >
                  <option value="huertero">👨‍🌾 Huertero (Recolección de Orgánicos)</option>
                  <option value="reciclador">♻️ Reciclador (Recolección de Reciclables)</option>
                </select>

                <input type="text" placeholder="Nombre completo *" value={regNombre} onFocus={() => hablar("Escribe tu nombre completo")} onChange={(e) => setRegNombre(e.target.value)} className="p-3 rounded-xl border-2 border-stone-300 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Usuario *" value={regUsername} onFocus={() => hablar("Escribe un nombre de usuario para iniciar sesión")} onChange={(e) => setRegUsername(e.target.value)} className="p-3 rounded-xl border-2 border-stone-300 text-sm" />
                  <input type="password" placeholder="Contraseña *" value={regPassword} onFocus={() => hablar("Escribe una contraseña fácil de recordar")} onChange={(e) => setRegPassword(e.target.value)} className="p-3 rounded-xl border-2 border-stone-300 text-sm" />
                </div>
                <input type="tel" placeholder="Número de WhatsApp *" value={regTelefono} onFocus={() => hablar("Escribe tu número de WhatsApp")} onChange={(e) => setRegTelefono(e.target.value)} className="p-3 rounded-xl border-2 border-green-500 text-sm font-bold" />
                <input type="text" placeholder="Dirección o Manzana / Casa *" value={regDireccion} onFocus={() => hablar("Escribe tu dirección, manzana y casa")} onChange={(e) => setRegDireccion(e.target.value)} className="p-3 rounded-xl border-2 border-stone-300 text-sm" />
                <input type="text" placeholder="Vehículo o herramienta de trabajo" value={regVehiculo} onFocus={() => hablar("Escribe qué vehículo o herramienta de trabajo tienes")} onChange={(e) => setRegVehiculo(e.target.value)} className="p-3 rounded-xl border-2 border-stone-300 text-sm" />
                <textarea
                  placeholder="Todos tus requerimientos operativos, horarios disponibles, zonas y capacidad..." onFocus={() => hablar("Escribe tus horarios disponibles, zonas y capacidad de recolección")}
                  value={regRequerimientos}
                  onChange={(e) => setRegRequerimientos(e.target.value)}
                  rows={3}
                  className="p-3 rounded-xl border-2 border-stone-300 text-sm"
                />

                <BotonAccesible
                  idBoton="btn_registrar_perfil"
                  textoVisual="REGISTRAR PERFIL PARA APROBACIÓN"
                  subtextoVisual="Se guarda en la base de datos para revisión del Administrador"
                  textoAudio="Registrar perfil para aprobación del administrador."
                  icono="📝"
                  colorClase="bg-emerald-700 text-white border-emerald-950"
                  onEjecutar={registrarNuevoPerfil}
                />
              </div>
            )}

            {vistaPublica === "login" && (
              <div className="bg-white p-5 rounded-2xl border-2 border-stone-300 flex flex-col gap-3 shadow-sm">
                <h2 className="font-black text-lg">Acceso Coordinadores, Equipo y Administración</h2>
                <p className="text-xs text-stone-600">
                  Solo los Coordinadores tienen control total para gestionar y programar las solicitudes de recolección.
                </p>

                {errorAcceso && (
                  <div className="bg-red-100 border-2 border-red-500 text-red-900 p-3 rounded-xl text-sm font-bold">
                    ⚠️ {errorAcceso}
                  </div>
                )}

                <input type="text" placeholder="Usuario" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="p-3 rounded-xl border-2 border-stone-300 font-semibold text-sm" />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && iniciarSesion()}
                  className="p-3 rounded-xl border-2 border-stone-300 font-semibold text-sm"
                />
                <BotonAccesible
                  idBoton="btn_ingresar"
                  textoVisual="ENTRAR"
                  subtextoVisual="Iniciar sesión con credenciales privadas"
                  textoAudio="Entrar a la plataforma."
                  icono="🔐"
                  colorClase="bg-emerald-700 text-white border-emerald-950"
                  onEjecutar={iniciarSesion}
                />
              </div>
            )}
          </>
        )}

        {esCoordinador && (
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  hablar("Bandeja de control total");
                  setVistaCoord("bandeja");
                }}
                className={`p-3 rounded-xl font-black text-xs border-2 ${
                  vistaCoord === "bandeja" ? "bg-emerald-700 text-white border-emerald-950" : "bg-white"
                }`}
              >
                📋 Solicitudes ({solicitudes.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  hablar("Gestión de equipo");
                  setVistaCoord("equipo");
                }}
                className={`p-3 rounded-xl font-black text-xs border-2 ${
                  vistaCoord === "equipo" ? "bg-emerald-700 text-white border-emerald-950" : "bg-white"
                }`}
              >
                👷 Personal ({rolEquipoCoord}s)
              </button>
            </div>

            {vistaCoord === "bandeja" && (
              <>
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-700 flex flex-col gap-2.5">
                  <div>
                    <h2 className="font-black text-base">
                      Control Total •{" "}
                      {flujoCoord === "organico"
                        ? "Coordinador de Huerteros (Orgánicos)"
                        : "Coordinador de Recicladores (Reciclables)"}
                    </h2>
                    <p className="text-xs text-stone-600">
                      Escucha las notas de voz o revisa fotos/ubicaciones en WhatsApp Business y registra aquí la solicitud para asignarla.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !mostrarFormAudioCoord;
                      setMostrarFormAudioCoord(next);
                      hablar(
                        next
                          ? "Formulario para registrar solicitud recibida por audio o WhatsApp Business"
                          : "Formulario cerrado"
                      );
                    }}
                    className="bg-green-700 hover:bg-green-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs text-center"
                  >
                    {mostrarFormAudioCoord
                      ? "✖️ Cerrar formulario de registro manual"
                      : "🎙️ + Registrar Solicitud de Audio / WhatsApp Business"}
                  </button>

                  {mostrarFormAudioCoord && (
                    <div className="bg-green-50 p-3.5 rounded-xl border-2 border-green-600 flex flex-col gap-2 mt-1">
                      <p className="font-black text-xs text-green-950">
                        Registro manual desde WhatsApp Business ({flujoCoord.toUpperCase()})
                      </p>
                      <select
                        value={audioCanalMedio}
                        onChange={(e) => setAudioCanalMedio(e.target.value)}
                        className="p-2 rounded-lg border bg-white text-xs font-bold"
                      >
                        <option value="whatsapp_audio">🎙️ Nota de voz / Audio escuchado en WhatsApp Business</option>
                        <option value="whatsapp_texto">💬 Mensaje escrito en WhatsApp Business</option>
                        <option value="whatsapp_foto">📸 Fotografía + Audio/Texto en WhatsApp Business</option>
                        <option value="whatsapp_ubicacion">📍 Ubicación compartida en WhatsApp Business</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nombre del habitante o comercio"
                        value={audioVecinoNombre}
                        onChange={(e) => setAudioVecinoNombre(e.target.value)}
                        className="p-2 border rounded-lg text-xs bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="Número de WhatsApp del habitante (+57) *"
                        value={audioVecinoTel}
                        onChange={(e) => setAudioVecinoTel(e.target.value)}
                        className="p-2 border rounded-lg text-xs bg-white font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Dirección manual / Manzana y Casa / Ubicación *"
                        value={audioVecinoDir}
                        onChange={(e) => setAudioVecinoDir(e.target.value)}
                        className="p-2 border rounded-lg text-xs bg-white font-bold"
                      />
                      <textarea
                        rows={3}
                        placeholder="Detalle escuchado en el audio o visto en la foto (ej. 2 bolsas de cáscaras de frutas, entregar en la mañana) *"
                        value={audioResumenEscuchado}
                        onChange={(e) => setAudioResumenEscuchado(e.target.value)}
                        className="p-2 border rounded-lg text-xs bg-white"
                      />
                      <select
                        value={audioHorario}
                        onChange={(e) => setAudioHorario(e.target.value)}
                        className="p-2 border rounded-lg text-xs bg-white font-bold"
                      >
                        <option value="Mañana (8:00 AM - 12:00 PM)">☀️ Mañana (8:00 AM - 12:00 PM)</option>
                        <option value="Tarde (2:00 PM - 5:00 PM)">🌤️ Tarde (2:00 PM - 5:00 PM)</option>
                      </select>
                      <button
                        type="button"
                        onClick={registrarSolicitudDesdeAudioCoord}
                        className="bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs"
                      >
                        ✅ Guardar Solicitud en Bandeja
                      </button>
                    </div>
                  )}
                </div>

                {solicitudes.length === 0 && (
                  <p className="bg-white p-4 rounded-2xl border text-sm text-stone-600">
                    No hay solicitudes registradas aún en este flujo.
                  </p>
                )}

                {solicitudes.map((s) => {
                  const equipoAprobado = usuarios.filter(
                    (u) => u.rol === rolEquipoCoord && u.aprobado
                  );
                  const etiquetaCanal: Record<string, string> = {
                    whatsapp_cloud: "🤖 Camilo WA Cloud", whatsapp_audio: "🎙️ Audio WA Business",
                    whatsapp_texto: "💬 Chat WA Business",
                    whatsapp_foto: "📸 Foto WA Business",
                    whatsapp_ubicacion: "📍 Ubicación WA",
                    asistente_web: "💬 Asistente Web",
                    web: "🌐 Web",
                  };
                  return (
                    <div
                      key={s.id}
                      className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-black bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full">
                              {s.codigo} • {s.estado}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-950 border border-green-400">
                              {etiquetaCanal[s.canal_origen || "web"] || s.canal_origen}
                            </span>
                          </div>
                          <p className="font-extrabold text-base mt-1">{s.solicitante_nombre}</p>
                          <p className="text-sm font-bold text-stone-800">📍 {s.solicitante_direccion}</p>
                          <p className="text-xs text-green-800 font-bold">📱 WhatsApp: +{s.solicitante_telefono}</p>
                          <p className="text-xs text-stone-600">⏰ {s.disponibilidad_horaria}</p>
                          {s.descripcion && (
                            <p className="text-xs text-stone-800 bg-stone-50 p-2 rounded-lg border mt-1">
                              📝 <strong>Detalle:</strong> {s.descripcion}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              hablar("Editar solicitud");
                              setEditandoSolId(editandoSolId === s.id ? null : s.id);
                              setEditSolNombre(s.solicitante_nombre);
                              setEditSolDir(s.solicitante_direccion);
                              setEditSolTel(s.solicitante_telefono);
                              setEditSolHorario(s.disponibilidad_horaria);
                              setEditSolEstado(s.estado);
                            }}
                            className="px-2.5 py-1.5 bg-sky-100 text-sky-900 rounded-lg text-xs font-bold"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarSolicitud(s.id)}
                            className="px-2.5 py-1.5 bg-red-100 text-red-900 rounded-lg text-xs font-bold"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {editandoSolId === s.id && (
                        <div className="bg-sky-50 p-3 rounded-xl border border-sky-300 flex flex-col gap-2">
                          <input type="text" value={editSolNombre} onChange={(e) => setEditSolNombre(e.target.value)} className="p-2 border rounded-lg text-xs bg-white" placeholder="Nombre solicitante" />
                          <input type="text" value={editSolDir} onChange={(e) => setEditSolDir(e.target.value)} className="p-2 border rounded-lg text-xs bg-white" placeholder="Dirección" />
                          <input type="text" value={editSolTel} onChange={(e) => setEditSolTel(e.target.value)} className="p-2 border rounded-lg text-xs bg-white" placeholder="WhatsApp" />
                          <select value={editSolEstado} onChange={(e) => setEditSolEstado(e.target.value)} className="p-2 border rounded-lg text-xs bg-white font-bold">
                            <option value="recibida">recibida</option>
                            <option value="en_revision">en_revision</option>
                            <option value="programada">programada</option>
                            <option value="recolectada">recolectada</option>
                            <option value="cancelada">cancelada</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => guardarEdicionSolicitud(s.id)}
                            className="bg-sky-700 text-white font-bold py-2 rounded-lg text-xs"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      )}

                      {s.estado !== "recolectada" && (
                        <div className="bg-stone-50 p-3 rounded-xl border flex flex-col gap-2">
                          <select
                            className="p-2.5 rounded-lg border bg-white text-sm font-bold"
                            value={recolectorSel[s.id] || s.recolector_id || ""}
                            onChange={(e) =>
                              setRecolectorSel({ ...recolectorSel, [s.id]: Number(e.target.value) })
                            }
                          >
                            <option value="">1. Asignar {rolEquipoCoord} aprobado...</option>
                            {equipoAprobado.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nombre} ({r.vehiculo_herramienta || "Sin vehículo"})
                              </option>
                            ))}
                          </select>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              className="p-2 rounded-lg border bg-white text-sm"
                              value={fechaSel[s.id] || s.fecha_programada || ""}
                              onChange={(e) => setFechaSel({ ...fechaSel, [s.id]: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Hora asignada"
                              className="p-2 rounded-lg border bg-white text-sm"
                              value={horaSel[s.id] || s.hora_programada || ""}
                              onChange={(e) => setHoraSel({ ...horaSel, [s.id]: e.target.value })}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => programarSolicitud(s.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs"
                          >
                            📅 Programar y Preparar Mensaje de WhatsApp Business
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => verHistorial(s.id)}
                        className="text-xs font-bold text-sky-800 underline text-left"
                      >
                        {historialAbierto[s.id] ? "Ocultar trazabilidad" : "Ver trazabilidad"}
                      </button>

                      {historialAbierto[s.id] && (
                        <ul className="bg-stone-100 p-2.5 rounded-xl text-xs flex flex-col gap-1">
                          {historialAbierto[s.id].map((h) => (
                            <li key={h.id}>
                              <strong>{h.estado_nuevo.toUpperCase()}</strong> ({h.actor_nombre}): {h.observacion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {vistaCoord === "equipo" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-600 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-base text-emerald-950">➕ Añadir Nuevo {rolEquipoCoord}</h3>
                      <p className="text-xs text-stone-600">
                        Toca cada cuadro para escuchar la instrucción de voz antes de escribir.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        hablar(
                          `Formulario para añadir nuevo ${rolEquipoCoord}. Toca cada casilla para escuchar qué dato debes escribir y al terminar presiona Guardar y Activar ${rolEquipoCoord}.`
                        )
                      }
                      className="bg-emerald-100 text-emerald-950 font-extrabold text-xs px-3 py-2 rounded-xl border border-emerald-600"
                    >
                      🔊 Escuchar guía
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={nuevoStaffNombre}
                    onFocus={() => hablar(`Paso uno: escribe el nombre completo del nuevo ${rolEquipoCoord}.`)}
                    onChange={(e) => setNuevoStaffNombre(e.target.value)}
                    className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Usuario *"
                      value={nuevoStaffUser}
                      onFocus={() => hablar("Paso dos: escribe un nombre de usuario para iniciar sesión.")}
                      onChange={(e) => setNuevoStaffUser(e.target.value)}
                      className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña *"
                      value={nuevoStaffPass}
                      onFocus={() => hablar("Paso tres: escribe una contraseña fácil de recordar.")}
                      onChange={(e) => setNuevoStaffPass(e.target.value)}
                      className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Número de WhatsApp *"
                    value={nuevoStaffTel}
                    onFocus={() => hablar(`Paso cuatro: escribe el número de WhatsApp del ${rolEquipoCoord}.`)}
                    onChange={(e) => setNuevoStaffTel(e.target.value)}
                    className="p-3 border-2 border-green-500 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Dirección *"
                    value={nuevoStaffDir}
                    onFocus={() => hablar(`Paso cinco: escribe la dirección, manzana y casa del ${rolEquipoCoord}.`)}
                    onChange={(e) => setNuevoStaffDir(e.target.value)}
                    className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Vehículo / Herramienta"
                    value={nuevoStaffVehiculo}
                    onFocus={() => hablar("Paso seis: escribe qué vehículo o herramienta de trabajo tiene, como carretilla, triciclo o motocarro.")}
                    onChange={(e) => setNuevoStaffVehiculo(e.target.value)}
                    className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Requerimientos operativos"
                    value={nuevoStaffReq}
                    onFocus={() => hablar("Paso siete: escribe sus horarios disponibles, sectores y capacidad de recolección.")}
                    onChange={(e) => setNuevoStaffReq(e.target.value)}
                    className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      hablar(`Guardando y activando nuevo ${rolEquipoCoord}.`);
                      crearUsuarioDesdeStaff(rolEquipoCoord);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 rounded-xl text-xs"
                  >
                    ✅ Guardar y Activar {rolEquipoCoord}
                  </button>
                </div>

                {usuarios
                  .filter((u) => u.rol === rolEquipoCoord)
                  .map((u) => (
                    <div key={u.id} className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
                      <div>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            u.aprobado ? "bg-emerald-100 text-emerald-900" : "bg-amber-200 text-amber-950"
                          }`}
                        >
                          {u.aprobado ? "✅ Aprobado" : "⏳ Pendiente de Aprobación"}
                        </span>
                        <p className="font-black text-base mt-1">{u.nombre}</p>
                        <p className="text-xs text-stone-700">📱 WhatsApp: +{u.telefono} • Usuario: {u.username}</p>
                        <p className="text-xs text-stone-700">📍 {u.direccion}</p>
                        {u.vehiculo_herramienta && (
                          <p className="text-xs text-emerald-900 font-bold">🚛 {u.vehiculo_herramienta}</p>
                        )}
                        {u.requerimientos_operativos && (
                          <p className="text-xs text-stone-600">📝 {u.requerimientos_operativos}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditorUsuario(u)}
                          className="bg-sky-100 text-sky-900 font-bold text-xs px-3 py-2 rounded-xl"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarUsuario(u)}
                          className="bg-red-100 text-red-900 font-bold text-xs px-3 py-2 rounded-xl"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>

                      {editandoUserId === u.id && (
                        <div className="bg-stone-50 p-3 rounded-xl border flex flex-col gap-2">
                          <input type="text" value={editUserNombre} onChange={(e) => setEditUserNombre(e.target.value)} placeholder="Nombre" className="p-2 border rounded text-xs" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={editUserUsername} onChange={(e) => setEditUserUsername(e.target.value)} placeholder="Usuario" className="p-2 border rounded text-xs" />
                            <input type="password" value={editUserPass} onChange={(e) => setEditUserPass(e.target.value)} placeholder="Nueva clave (opcional)" className="p-2 border rounded text-xs" />
                          </div>
                          <input type="text" value={editUserTel} onChange={(e) => setEditUserTel(e.target.value)} placeholder="WhatsApp" className="p-2 border rounded text-xs" />
                          <input type="text" value={editUserDir} onChange={(e) => setEditUserDir(e.target.value)} placeholder="Dirección" className="p-2 border rounded text-xs" />
                          <input type="text" value={editUserVehiculo} onChange={(e) => setEditUserVehiculo(e.target.value)} placeholder="Vehículo/Herramienta" className="p-2 border rounded text-xs" />
                          <input type="text" value={editUserReq} onChange={(e) => setEditUserReq(e.target.value)} placeholder="Requerimientos" className="p-2 border rounded text-xs" />
                          <button
                            type="button"
                            onClick={() => aprobarOEditarUsuario(u)}
                            className="bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {esRecolector && (
          <section className="flex flex-col gap-4">
            <h2 className="font-black text-lg">Mis Tareas Asignadas </h2>
            {solicitudes.length === 0 && (
              <p className="bg-white p-4 rounded-2xl border text-sm text-stone-600">
                Aún no tienes tareas asignadas. Cuando el Coordinador te programe una recolección, te enviará la ubicación, el día y la hora a tu WhatsApp (+{usuarioActual?.telefono}).
              </p>
            )}
            {solicitudes.map((s) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-2xl border-2 border-emerald-600 flex flex-col gap-3"
              >
                <div>
                  <span className="text-xs font-black bg-emerald-100 px-2 py-0.5 rounded">
                    {s.codigo} • {s.estado}
                  </span>
                  <p className="font-black text-lg mt-1">{s.solicitante_nombre}</p>
                  <p className="text-sm font-bold text-stone-800">📍 {s.solicitante_direccion}</p>
                  <p className="text-xs text-stone-600">📱 WhatsApp: +{s.solicitante_telefono}</p>
                  <p className="text-sm font-extrabold text-emerald-900 mt-1">
                    📅 {s.fecha_programada} • ⏰ {s.hora_programada}
                  </p>
                  {s.descripcion && <p className="text-xs text-stone-700 mt-1">📝 {s.descripcion}</p>}
                </div>

                {s.estado === "programada" ? (
                  <BotonAccesible
                    idBoton={`cerrar_${s.id}`}
                    textoVisual="CONFIRMAR RECOLECCIÓN REALIZADA"
                    subtextoVisual="Cierra la tarea asignada"
                    textoAudio="Confirmar recolección realizada."
                    icono="✅"
                    colorClase="bg-emerald-600 text-white border-emerald-950"
                    onEjecutar={() => cerrarRecoleccion(s.id)}
                  />
                ) : (
                  <p className="font-extrabold text-emerald-700 text-center bg-emerald-50 py-2 rounded-xl">
                    ✅ Recolección completada
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {usuarioActual && ["admin", "coord_huerteros", "coord_recicladores", "huertero", "reciclador"].includes(usuarioActual.rol) && (
  <section className="bg-white p-4 rounded-2xl border-2 border-[#0A9B70] flex flex-col gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPestanaActiva("gestion");
            hablar("Pestaña de gestión activa.");
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
            pestanaActiva === "gestion"
              ? "bg-[#063B2E] text-white border-[#063B2E]"
              : "bg-[#FFFFFF] text-[#063B2E] border-[#0A9B70]"
          }`}
        >
          📋 Gestión
        </button>
        <button
          type="button"
          onClick={() => {
            setPestanaActiva("calendario");
            const msgCal = "Pestaña calendario abierta. Selecciona una fecha o visita para escuchar día, mes, año y encargado.";
            setMensajeSistema(msgCal);
            hablar(msgCal);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
            pestanaActiva === "calendario"
              ? "bg-[#168A2E] text-white border-[#063B2E]"
              : "bg-[#FFFFFF] text-[#063B2E] border-[#168A2E]"
          }`}
        >
          📅 Calendario
        </button>
      </div>
    </div>

    {pestanaActiva === "calendario" && (() => {
      const paletaEco = [
        { bg: "#168A2E", border: "#063B2E", text: "#FFFFFF", nombreColor: "Verde Eco" },
        { bg: "#0A9B70", border: "#063B2E", text: "#FFFFFF", nombreColor: "Verde Turquesa" },
        { bg: "#65A90A", border: "#063B2E", text: "#FFFFFF", nombreColor: "Verde Hoja" },
        { bg: "#F6C400", border: "#063B2E", text: "#063B2E", nombreColor: "Amarillo Solar" },
        { bg: "#F28C00", border: "#063B2E", text: "#063B2E", nombreColor: "Naranja Mariposa" },
      ];

      const operativos = usuarios.filter((u) => ["huertero", "reciclador"].includes(u.rol));
      const colorEmpleado = (idEmp?: number | null) => {
        if (!idEmp) return { bg: "#063B2E", border: "#063B2E", text: "#FFFFFF", nombreColor: "Verde Bosque" };
        const idx = operativos.findIndex((u) => Number(u.id) === Number(idEmp));
        return paletaEco[(idx >= 0 ? idx : Number(idEmp)) % paletaEco.length];
      };

      const mesesEs = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      const diasCortos = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

      const parseFechaLocal = (iso: string) => {
        const p = iso.split("-").map(Number);
        if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return new Date();
        return new Date(p[0], p[1] - 1, p[2]);
      };

      const toIsoLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const describirFecha = (iso: string) => {
        const d = parseFechaLocal(iso);
        return `${d.getDate()} de ${mesesEs[d.getMonth()]} de ${d.getFullYear()}`;
      };

      const fechaBase = parseFechaLocal(fechaCalendarioSel);
      const diaSemana = fechaBase.getDay();
      const inicioSemana = new Date(fechaBase);
      inicioSemana.setDate(fechaBase.getDate() - diaSemana);

      const diasSemana = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(inicioSemana);
        d.setDate(inicioSemana.getDate() + i);
        return {
          iso: toIsoLocal(d),
          etiqueta: diasCortos[d.getDay()],
          numero: d.getDate(),
        };
      });

      const franjasHoras = [
        "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
      ];

      const coincideHora = (horaProg: string | undefined | null, franja: string) => {
        const h = (horaProg || "").trim().toUpperCase().replace(/\s+/g, "");
        const f = franja.trim().toUpperCase().replace(/\s+/g, "");
        if (!h) return false;
        if (h === f) return true;
        const horaNum = f.split(":")[0];
        const ampm = f.includes("AM") ? "AM" : "PM";
        return h.startsWith(horaNum + ":") && h.endsWith(ampm);
      };

      const esPrivilegiado = ["admin", "coord_huerteros", "coord_recicladores"].includes(usuarioActual.rol);

      const visitasVisibles = solicitudes.filter((s) => {
        if (!s.fecha_programada) return false;
        if (usuarioActual.rol === "coord_huerteros" && s.flujo !== "organico") return false;
        if (usuarioActual.rol === "coord_recicladores" && s.flujo !== "reciclable") return false;
        return true;
      });

      const visitasSemana = visitasVisibles.filter((s) =>
        diasSemana.some((d) => d.iso === String(s.fecha_programada))
      );

      const descansosSemana = descansosCalendario.filter((desc) =>
        diasSemana.some((d) => d.iso === desc.fecha)
      );

      const leerVisitaConReglas = (vis: any) => {
        const encObj = usuarios.find((u) => Number(u.id) === Number(vis.recolector_id));
        const encNombre = encObj?.nombre || "Sin encargado asignado";
        const esEncargado = Number(vis.recolector_id) === Number(usuarioActual.id);
        const completo = esPrivilegiado || esEncargado;
        const fechaTexto = describirFecha(String(vis.fecha_programada || fechaCalendarioSel));
        const horaTexto = String(vis.hora_programada || vis.disponibilidad_horaria || "Horario por confirmar");

        if (completo) {
          const msg = `Visita ${vis.codigo}. Encargado: ${encNombre}. Día ${fechaTexto}, hora ${horaTexto}. Solicitante: ${vis.solicitante_nombre}, dirección: ${vis.solicitante_direccion}. Detalle: ${vis.descripcion || "recolección"}.`;
          setMensajeSistema(msg);
          hablar(msg);
        } else {
          const msg = `Visita el ${fechaTexto}, hora general ${horaTexto}. Encargado: ${encNombre}. Datos privados restringidos a quien no esté asignado.`;
          setMensajeSistema(msg);
          hablar(msg);
        }
      };

      const totalVisitasSemana = visitasSemana.length;
      const totalDescansosSemana = descansosSemana.length;

      return (
        <div className="flex flex-col lg:flex-row gap-4 bg-[#FFFFFF] p-3 rounded-2xl border border-[#0A9B70]">
          {/* Columna principal: Agenda semanal tipo cuadrícula con colores EcoConecta */}
          <div className="flex-1 flex flex-col gap-3 overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(fechaBase);
                    prev.setDate(fechaBase.getDate() - 7);
                    const iso = toIsoLocal(prev);
                    setFechaCalendarioSel(iso);
                    hablar(`Semana anterior. Fecha activa: ${describirFecha(iso)}.`);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[#063B2E] bg-[#FFFFFF] text-[#063B2E] text-xs font-black"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const hoy = toIsoLocal(new Date());
                    setFechaCalendarioSel(hoy);
                    hablar(`Hoy, ${describirFecha(hoy)}.`);
                  }}
                  className="px-3 py-1 rounded-lg border border-[#063B2E] bg-[#168A2E] text-[#FFFFFF] text-xs font-black"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(fechaBase);
                    next.setDate(fechaBase.getDate() + 7);
                    const iso = toIsoLocal(next);
                    setFechaCalendarioSel(iso);
                    hablar(`Semana siguiente. Fecha activa: ${describirFecha(iso)}.`);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[#063B2E] bg-[#FFFFFF] text-[#063B2E] text-xs font-black"
                >
                  &gt;
                </button>
                <span className="text-sm font-black text-[#063B2E] ml-1">
                  {mesesEs[fechaBase.getMonth()].charAt(0).toUpperCase() + mesesEs[fechaBase.getMonth()].slice(1)} {fechaBase.getFullYear()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fechaCalendarioSel}
                  onChange={(e) => {
                    const nueva = e.target.value;
                    setFechaCalendarioSel(nueva);
                    hablar(`Seleccionaste el ${describirFecha(nueva)}.`);
                  }}
                  className="p-1.5 rounded-lg border border-[#063B2E] text-xs font-bold text-[#063B2E]"
                />
                <button
                  type="button"
                  onClick={() => hablar(`Calendario de ${describirFecha(fechaCalendarioSel)}.`)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F6C400] text-[#063B2E] border border-[#063B2E] text-xs font-black"
                >
                  🔊 Voz
                </button>
              </div>
            </div>

            {/* Encabezado de días de la semana */}
            <div className="min-w-[680px] border border-[#063B2E]/20 rounded-xl overflow-hidden">
              <div className="grid grid-cols-8 bg-[#063B2E] text-[#FFFFFF] text-center text-xs font-black">
                <div className="p-2 border-r border-[#FFFFFF]/20">Hora</div>
                {diasSemana.map((d) => {
                  const activa = d.iso === fechaCalendarioSel;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => {
                        setFechaCalendarioSel(d.iso);
                        hablar(`${d.etiqueta}, ${describirFecha(d.iso)}.`);
                      }}
                      className={`p-2 border-r border-[#FFFFFF]/20 flex flex-col items-center justify-center ${
                        activa ? "bg-[#168A2E]" : "hover:bg-[#0A9B70]"
                      }`}
                    >
                      <span className="text-[10px] uppercase opacity-90">{d.etiqueta}</span>
                      <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center font-black ${
                        activa ? "bg-[#F6C400] text-[#063B2E]" : ""
                      }`}>
                        {d.numero}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filas horarias */}
              {franjasHoras.map((franja) => (
                <div key={franja} className="grid grid-cols-8 border-t border-[#063B2E]/15 min-h-[58px] bg-[#FFFFFF]">
                  <div className="p-1.5 text-[11px] font-bold text-[#063B2E] border-r border-[#063B2E]/15 flex items-start justify-end">
                    {franja}
                  </div>
                  {diasSemana.map((dia) => {
                    const celdasVisitas = visitasSemana.filter(
                      (v) => String(v.fecha_programada) === dia.iso && coincideHora(v.hora_programada || v.disponibilidad_horaria, franja)
                    );
                    const celdasDescanso = descansosSemana.filter(
                      (desc) => desc.fecha === dia.iso && coincideHora(desc.hora, franja)
                    );

                    return (
                      <div
                        key={`${dia.iso}-${franja}`}
                        onClick={() => {
                          if (celdasVisitas.length === 0 && celdasDescanso.length === 0) {
                            setFechaCalendarioSel(dia.iso);
                            hablar(`${dia.etiqueta} ${describirFecha(dia.iso)}, ${franja}.`);
                          }
                        }}
                        className="p-1 border-r border-[#063B2E]/15 flex flex-col gap-1 cursor-pointer hover:bg-[#65A90A]/10"
                      >
                        {celdasVisitas.map((vis) => {
                          const col = colorEmpleado(vis.recolector_id);
                          const encObj = usuarios.find((u) => Number(u.id) === Number(vis.recolector_id));
                          const encNombre = encObj?.nombre || "Sin asignar";
                          const esEnc = Number(vis.recolector_id) === Number(usuarioActual.id);
                          const verTodo = esPrivilegiado || esEnc;

                          return (
                            <button
                              key={vis.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                leerVisitaConReglas(vis);
                              }}
                              style={{ backgroundColor: col.bg, color: col.text, borderColor: col.border }}
                              className="w-full text-left p-1.5 rounded-lg border text-[11px] font-extrabold leading-tight shadow-sm"
                            >
                              <div className="truncate">
                                {verTodo ? `${vis.codigo} • ${vis.solicitante_nombre}` : `Visita • ${encNombre}`}
                              </div>
                              <div className="text-[10px] opacity-95 truncate">
                                {encNombre} • {vis.hora_programada || franja}
                              </div>
                            </button>
                          );
                        })}

                        {celdasDescanso.map((desc) => {
                          const col = colorEmpleado(desc.usuarioId);
                          return (
                            <button
                              key={desc.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const msg = `Descanso de ${desc.nombre} el ${describirFecha(desc.fecha)}, ${desc.hora}. ${desc.nota}`;
                                setMensajeSistema(msg);
                                hablar(msg);
                              }}
                              style={{ backgroundColor: "#FFFFFF", color: "#063B2E", borderColor: col.bg }}
                              className="w-full text-left p-1 rounded-lg border-2 border-dashed text-[10px] font-black truncate"
                            >
                              🛋️ {desc.nombre}: {desc.hora}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Panel lateral tipo resumen con paleta EcoConecta */}
          <aside className="w-full lg:w-72 bg-[#FFFFFF] border border-[#063B2E]/20 rounded-2xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#063B2E]/15 pb-2">
              <h3 className="text-sm font-black text-[#063B2E]">Resumen de Agenda</h3>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#65A90A] text-[#063B2E]">
                {describirFecha(fechaCalendarioSel)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-[#168A2E] text-[#FFFFFF]">
                <p className="text-base font-black">{totalVisitasSemana}</p>
                <p className="text-[10px] font-bold">Visitas semana</p>
              </div>
              <div className="p-2 rounded-xl bg-[#0A9B70] text-[#FFFFFF]">
                <p className="text-base font-black">{totalDescansosSemana}</p>
                <p className="text-[10px] font-bold">Descansos semana</p>
              </div>
            </div>

            {/* Colores por empleado */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-black text-[#063B2E]">Empleados y colores</p>
              {operativos.map((emp) => {
                const col = colorEmpleado(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => hablar(`${emp.nombre}, ${emp.rol}, color ${col.nombreColor}.`)}
                    className="flex items-center justify-between text-xs font-bold text-[#063B2E] bg-[#FFFFFF] hover:bg-[#65A90A]/10 p-1.5 rounded-lg border border-[#063B2E]/15"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        style={{ backgroundColor: col.bg, borderColor: col.border }}
                        className="w-3.5 h-3.5 rounded-full border inline-block shrink-0"
                      />
                      <span className="truncate">{emp.nombre}</span>
                    </span>
                    <span className="text-[10px] font-black">{emp.rol === "huertero" ? "Huertero" : "Reciclador"}</span>
                  </button>
                );
              })}
            </div>

            {/* Registrar descanso en el día */}
            <div className="border-t border-[#063B2E]/15 pt-2.5 flex flex-col gap-2">
              <p className="text-xs font-black text-[#063B2E]">🛋️ Poner descanso en el día</p>
              <input
                type="text"
                value={horaDescansoInput}
                onChange={(e) => setHoraDescansoInput(e.target.value)}
                placeholder="Ej: 12:00 PM o 2:00 PM"
                className="p-2 rounded-lg border border-[#063B2E] text-xs text-[#063B2E]"
              />
              <input
                type="text"
                value={notaDescansoInput}
                onChange={(e) => setNotaDescansoInput(e.target.value)}
                placeholder="Detalle del descanso"
                className="p-2 rounded-lg border border-[#063B2E] text-xs text-[#063B2E]"
              />
              <button
                type="button"
                onClick={() => {
                  const item = {
                    id: `${Date.now()}`,
                    usuarioId: usuarioActual.id,
                    nombre: usuarioActual.nombre,
                    rol: usuarioActual.rol,
                    fecha: fechaCalendarioSel,
                    hora: horaDescansoInput.trim() || "12:00 PM",
                    nota: notaDescansoInput.trim() || "Descanso del día",
                  };
                  setDescansosCalendario((prev) => [...prev, item]);
                  const msg = `Descanso guardado para ${usuarioActual.nombre} el ${describirFecha(fechaCalendarioSel)} a las ${item.hora}.`;
                  setMensajeSistema(msg);
                  hablar(msg);
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#F28C00] text-[#063B2E] border border-[#063B2E] text-xs font-black"
              >
                + Guardar descanso
              </button>
            </div>
          </aside>
        </div>
      );
    })()}
            })}
          </div>

          {/* Selector de día, mes y año con voz */}
          <div className="flex flex-wrap items-center gap-2 bg-[#FFFFFF] p-2.5 rounded-xl border border-[#0A9B70]">
            <label className="text-xs font-black text-[#063B2E]">Día / Mes / Año:</label>
            <input
              type="date"
              value={fechaCalendarioSel}
              onChange={(e) => {
                const nuevaF = e.target.value;
                setFechaCalendarioSel(nuevaF);
                const msg = `Fecha seleccionada: ${describirFechaCompleta(nuevaF)}.`;
                setMensajeSistema(msg);
                hablar(msg);
              }}
              className="p-1.5 rounded-lg border border-[#063B2E] text-xs font-bold text-[#063B2E]"
            />
            <button
              type="button"
              onClick={() => {
                const msg = `Estás viendo el ${describirFechaCompleta(fechaCalendarioSel)}.`;
                hablar(msg);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-[#F6C400] text-[#063B2E] border border-[#063B2E]"
            >
              🔊 Escuchar fecha
            </button>
          </div>

          {/* Registrar descansos en el día para empleados (y gestión) */}
          {["huertero", "reciclador", "coord_huerteros", "coord_recicladores", "admin"].includes(usuarioActual.rol) && (
            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#65A90A] flex flex-col gap-2">
              <p className="text-xs font-black text-[#063B2E]">🛋️ Registrar descanso en el día ({describirFechaCompleta(fechaCalendarioSel)})</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={horaDescansoInput}
                  onChange={(e) => setHoraDescansoInput(e.target.value)}
                  placeholder="Franja de descanso (ej. 1:00 PM - 2:00 PM)"
                  className="p-2 rounded-lg border border-[#063B2E] text-xs"
                />
                <input
                  type="text"
                  value={notaDescansoInput}
                  onChange={(e) => setNotaDescansoInput(e.target.value)}
                  placeholder="Motivo o nota de descanso"
                  className="p-2 rounded-lg border border-[#063B2E] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nuevoDesc = {
                      id: `${Date.now()}`,
                      usuarioId: usuarioActual.id,
                      nombre: usuarioActual.nombre,
                      rol: usuarioActual.rol,
                      fecha: fechaCalendarioSel,
                      hora: horaDescansoInput.trim() || "Descanso del día",
                      nota: notaDescansoInput.trim() || "Descanso",
                    };
                    setDescansosCalendario((prev) => [...prev, nuevoDesc]);
                    const msg = `Descanso registrado para ${usuarioActual.nombre} el ${describirFechaCompleta(fechaCalendarioSel)} en horario ${nuevoDesc.hora}.`;
                    setMensajeSistema(msg);
                    hablar(msg);
                  }}
                  className="bg-[#168A2E] text-white font-black py-2 px-3 rounded-xl text-xs border border-[#063B2E]"
                >
                  ➕ Guardar descanso
                </button>
              </div>
            </div>
          )}

          {/* Descansos del día */}
          {descansosDia.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-black text-[#063B2E]">Descansos programados ({descansosDia.length})</p>
              {descansosDia.map((d) => {
                const col = colorPorEmpleado(d.usuarioId);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      hablar(`Descanso de ${d.nombre}, el ${describirFechaCompleta(d.fecha)}, horario ${d.hora}. ${d.nota}`)
                    }
                    style={{ backgroundColor: col.bg, color: col.text, borderColor: col.border }}
                    className="w-full text-left p-2.5 rounded-xl border text-xs font-bold flex justify-between items-center"
                  >
                    <span>🛋️ {d.nombre} ({d.rol}) • ⏰ {d.hora} • {d.nota}</span>
                    <span>🔊</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Visitas del día con privacidad por asignación y lectura de voz */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-[#063B2E]">
              Visitas del {describirFechaCompleta(fechaCalendarioSel)} ({eventosDia.length})
            </p>
            {eventosDia.length === 0 ? (
              <p className="text-xs font-bold text-[#063B2E] bg-[#FFFFFF] p-3 rounded-xl border border-[#0A9B70]">
                No hay visitas agendadas para el {describirFechaCompleta(fechaCalendarioSel)}.
              </p>
            ) : (
              eventosDia.map((vis) => {
                const encargadoObj = usuarios.find((u) => Number(u.id) === Number(vis.recolector_id));
                const nombreEncargado = encargadoObj?.nombre || "Sin encargado asignado";
                const esEncargadoAsignado = Number(vis.recolector_id) === Number(usuarioActual.id);
                const puedeVerDetalleCompleto = esPrivilegiado || esEncargadoAsignado;
                const col = colorPorEmpleado(vis.recolector_id);
                const fechaHabla = describirFechaCompleta(String(vis.fecha_programada || fechaCalendarioSel));
                const horaGeneral = String(vis.hora_programada || vis.disponibilidad_horaria || "Horario por confirmar");

                const leerVisita = () => {
                  if (puedeVerDetalleCompleto) {
                    const texto = `Visita ${vis.codigo}. Encargado: ${nombreEncargado}. Fecha: ${fechaHabla}. Hora: ${horaGeneral}. Solicitante: ${vis.solicitante_nombre}, dirección: ${vis.solicitante_direccion}. Detalle: ${vis.descripcion || "recolección programada"}.`;
                    setMensajeSistema(texto);
                    hablar(texto);
                  } else {
                    const textoRestringido = `Visita agendada el ${fechaHabla}, hora general ${horaGeneral}. Encargado: ${nombreEncargado}. Detalles privados reservados al encargado asignado, coordinador o administrador.`;
                    setMensajeSistema(textoRestringido);
                    hablar(textoRestringido);
                  }
                };

                return (
                  <button
                    key={vis.id}
                    type="button"
                    onClick={leerVisita}
                    style={{ borderColor: col.border }}
                    className="w-full text-left p-3 rounded-xl border-2 bg-[#FFFFFF] flex flex-col gap-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        style={{ backgroundColor: col.bg, color: col.text, borderColor: col.border }}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-black border"
                      >
                        Encargado: {nombreEncargado}
                      </span>
                      <span className="text-xs font-black text-[#063B2E]">
                        📅 {fechaHabla} • ⏰ {horaGeneral} • 🔊 Audio
                      </span>
                    </div>

                    {puedeVerDetalleCompleto ? (
                      <div className="text-xs text-[#063B2E] flex flex-col gap-0.5">
                        <p className="font-black">Visita {vis.codigo} • {vis.solicitante_nombre}</p>
                        <p className="font-bold">📍 {vis.solicitante_direccion}</p>
                        {vis.descripcion && <p>📦 Qué se recoge: {vis.descripcion}</p>}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-[#063B2E]">
                        🔒 Solo fecha, mes y hora general ({fechaHabla} • {horaGeneral}). Nombre, dirección y recolección visibles para el encargado asignado, coordinador o administrador.
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      );
    })()}
  </section>
)}
{esAdmin && (() => {
          const solPendientes = solicitudes.filter(
            (s) => s.estado !== "recolectada" && s.estado !== "cancelada"
          );
          const solCompletadas = solicitudes.filter((s) => s.estado === "recolectada");
          const solicitudesAdminVisibles =
            filtroAdminSol === "pendientes"
              ? solPendientes
              : filtroAdminSol === "completadas"
              ? solCompletadas
              : solicitudes;

          const etiquetaCanalAdmin: Record<string, string> = {
            whatsapp_cloud: "🤖 Camilo WA Cloud",
            whatsapp_audio: "🎙️ Audio WA Business",
            whatsapp_texto: "💬 Chat WA Business",
            whatsapp_foto: "📸 Foto WA Business",
            whatsapp_ubicacion: "📍 Ubicación WA",
            asistente_web: "💬 Asistente Web",
            web: "🌐 Web",
          };

          return (
            <section className="flex flex-col gap-5">
              {/* BLOQUE SUPERIOR: FILTROS JERARQUICOS (PENDIENTES / COMPLETADAS / TODAS + RECOLECCION / EQUIPO + HUERTEROS / RECICLADORES) */}
              {(() => {
                const pendientesRecoleccion = solicitudes.filter(
                  (s) => s.estado !== "recolectada" && s.estado !== "cancelada"
                );
                const completadasRecoleccion = solicitudes.filter((s) => s.estado === "recolectada");

                const pendientesEquipo = usuarios.filter((u) => !u.aprobado);
                const aprobadosEquipo = usuarios.filter((u) => u.aprobado);

                const recoleccionPorEstado =
                  filtroAdminSol === "pendientes"
                    ? pendientesRecoleccion
                    : filtroAdminSol === "completadas"
                    ? completadasRecoleccion
                    : solicitudes;

                const equipoPorEstado =
                  filtroAdminSol === "pendientes"
                    ? pendientesEquipo
                    : filtroAdminSol === "completadas"
                    ? aprobadosEquipo
                    : usuarios;

                const recoleccionFiltrada = recoleccionPorEstado.filter((s) => {
                  if (subFiltroCategoria === "equipo") return false;
                  if (subFiltroFlujo === "huertero") return s.flujo === "organico";
                  if (subFiltroFlujo === "reciclador") return s.flujo === "reciclable";
                  return true;
                });

                const equipoFiltrado = equipoPorEstado.filter((u) => {
                  if (subFiltroCategoria === "recoleccion") return false;
                  if (subFiltroFlujo === "huertero") return u.rol === "huertero" || u.rol === "coord_huerteros";
                  if (subFiltroFlujo === "reciclador") return u.rol === "reciclador" || u.rol === "coord_recicladores";
                  return true;
                });

                const totalPendientesGeneral = pendientesRecoleccion.length + pendientesEquipo.length;
                const totalCompletadasGeneral = completadasRecoleccion.length + aprobadosEquipo.length;
                const totalTodasGeneral = solicitudes.length + usuarios.length;

                return (
                  <div className="bg-white p-4 rounded-2xl border-2 border-amber-500 flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-3">
                      <div>
                        <h2 className="font-black text-base text-stone-900">
                          📋 Gestión Filtrada ({recoleccionFiltrada.length + equipoFiltrado.length})
                        </h2>
                        <p className="text-xs text-stone-600">
                          Estado: <strong>{filtroAdminSol}</strong> • Categoría: <strong>{subFiltroCategoria}</strong> • Flujo: <strong>{subFiltroFlujo}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroAdminSol("todas");
                            hablar(`Pestaña todas, ${totalTodasGeneral} registros.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                            filtroAdminSol === "todas"
                              ? "bg-stone-900 text-white border-stone-950"
                              : "bg-stone-100 text-stone-800 border-stone-300"
                          }`}
                        >
                          Todas ({totalTodasGeneral})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            // mantenido por seleccion del usuario
                            hablar(
                              `Pendientes: ${pendientesRecoleccion.length} recolecciones y ${pendientesEquipo.length} perfiles de equipo por aprobar.`
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                            filtroAdminSol === "pendientes"
                              ? "bg-amber-600 text-white border-amber-900"
                              : "bg-amber-50 text-amber-950 border-amber-300"
                          }`}
                        >
                          Pendientes ({totalPendientesGeneral})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFiltroAdminSol("completadas");
                            hablar(
                              `Completadas: ${completadasRecoleccion.length} recolecciones cerradas y ${aprobadosEquipo.length} integrantes aprobados.`
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                            filtroAdminSol === "completadas"
                              ? "bg-emerald-700 text-white border-emerald-950"
                              : "bg-emerald-50 text-emerald-950 border-emerald-300"
                          }`}
                        >
                          Completadas ({totalCompletadasGeneral})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (usuarioActual) {
                              cargarDatosPrivados(usuarioActual, false);
                              refrescarSolicitudesAdmin();
                              hablar("Actualizando solicitudes y equipo operativo.");
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-black border bg-sky-50 text-sky-950 border-sky-300"
                        >
                          🔄 Actualizar
                        </button>
                      </div>
                    </div>

                    {/* Subfiltro 1: Recolección vs Equipo Operativo */}
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: "todo", label: "Todo" },
                          { id: "recoleccion", label: "🚛 Recolección" },
                          { id: "equipo", label: "👷 Equipo Operativo" },
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSubFiltroCategoria(cat.id);
                            hablar(`Filtro de categoría: ${cat.label}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                            subFiltroCategoria === cat.id
                              ? "bg-emerald-700 text-white border-emerald-950"
                              : "bg-stone-50 text-stone-700 border-stone-300"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Subfiltro 2: Huerteros (Orgánicos) vs Recicladores (Reciclables) */}
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: "todos", label: "Todos los flujos" },
                          { id: "huertero", label: "🌱 Huerteros (Orgánicos)" },
                          { id: "reciclador", label: "♻️ Recicladores (Reciclables)" },
                        ] as const
                      ).map((fl) => (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => {
                            setSubFiltroFlujo(fl.id);
                            hablar(`Subfiltro: ${fl.label}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                            subFiltroFlujo === fl.id
                              ? "bg-sky-700 text-white border-sky-950"
                              : "bg-stone-50 text-stone-700 border-stone-300"
                          }`}
                        >
                          {fl.label}
                        </button>
                      ))}
                    </div>

                    {/* Equipo operativo correspondiente al estado y subfiltros */}
                    {equipoFiltrado.length > 0 && (
                      <div className="flex flex-col gap-2 pt-1">
                        <p className="text-xs font-black text-stone-800">
                          👷 Equipo Operativo en "{filtroAdminSol}" ({equipoFiltrado.length})
                        </p>
                        {equipoFiltrado.map((u) => (
                          <div
                            key={u.id}
                            className="bg-amber-50/60 p-3 rounded-xl border border-amber-300 flex justify-between items-start gap-2"
                          >
                            <div>
                              <span className="text-[11px] font-black bg-stone-200 px-2 py-0.5 rounded uppercase mr-1.5">
                                {u.rol}
                              </span>
                              <span
                                className={`text-[11px] font-black px-2 py-0.5 rounded ${
                                  u.aprobado ? "bg-emerald-100 text-emerald-900" : "bg-amber-200 text-amber-950"
                                }`}
                              >
                                {u.aprobado ? "✅ Aprobado" : "⏳ Pendiente por aprobar"}
                              </span>
                              <p className="font-black text-sm mt-1">{u.nombre}</p>
                              <p className="text-xs text-stone-700">
                                📱 +{u.telefono} • 📍 {u.direccion}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  hablar(
                                    `${u.nombre}, rol ${u.rol}, ${
                                      u.aprobado ? "aprobado" : "pendiente de aprobación"
                                    }, dirección ${u.direccion}.`
                                  )
                                }
                                className="bg-amber-100 text-amber-950 font-bold text-xs px-2.5 py-1 rounded-lg"
                              >
                                🔊 Escuchar
                              </button>
                              {!u.aprobado && (
                                <button
                                  type="button"
                                  onClick={() => aprobarOEditarUsuario(u, true)}
                                  className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg"
                                >
                                  ✅ Aprobar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Solicitudes de recolección correspondientes al estado y subfiltros */}
                    {recoleccionFiltrada.length > 0 && (
                      <div className="flex flex-col gap-2.5 pt-1">
                        <p className="text-xs font-black text-stone-800">
                          🚛 Solicitudes de Recolección en "{filtroAdminSol}" ({recoleccionFiltrada.length})
                        </p>
                        {recoleccionFiltrada.map((s) => {
                          const rolNecesario = s.flujo === "organico" ? "huertero" : "reciclador";
                          const equipoAprobado = usuarios.filter(
                            (u) => u.rol === rolNecesario && u.aprobado
                          );
                          return (
                            <div
                              key={s.id}
                              className="bg-stone-50 p-3.5 rounded-2xl border-2 border-stone-300 flex flex-col gap-2"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                                        s.estado === "recolectada"
                                          ? "bg-emerald-100 text-emerald-950"
                                          : "bg-amber-100 text-amber-950"
                                      }`}
                                    >
                                      {s.codigo} • {s.estado}
                                    </span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-stone-300 text-stone-800">
                                      {s.flujo === "organico" ? "🌱 Huerteros (Orgánicos)" : "♻️ Recicladores (Reciclables)"}
                                    </span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-950 border border-green-400">
                                      {etiquetaCanalAdmin[s.canal_origen || "web"] || s.canal_origen}
                                    </span>
                                  </div>
                                  <p className="font-extrabold text-base mt-1">{s.solicitante_nombre}</p>
                                  <p className="text-xs font-bold text-stone-800">📍 {s.solicitante_direccion}</p>
                                  <p className="text-xs text-green-800 font-bold">📱 WhatsApp: +{s.solicitante_telefono}</p>
                                  <p className="text-xs text-stone-600">⏰ {s.disponibilidad_horaria}</p>
                                  {s.descripcion && (
                                    <p className="text-xs text-stone-800 bg-white p-2 rounded-lg border mt-1">
                                      📝 <strong>Detalle:</strong> {s.descripcion}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      hablar(
                                        `Solicitud ${s.codigo}, ${
                                          s.flujo === "organico" ? "de huerteros, residuos orgánicos" : "de recicladores, residuos reciclables"
                                        }, estado ${s.estado}. ${s.solicitante_nombre}, dirección ${s.solicitante_direccion}.`
                                      )
                                    }
                                    className="px-2.5 py-1.5 bg-amber-100 text-amber-950 rounded-lg text-xs font-bold"
                                  >
                                    🔊 Escuchar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarSolicitud(s.id)}
                                    className="px-2.5 py-1.5 bg-red-100 text-red-900 rounded-lg text-xs font-bold"
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              </div>

                              {s.estado !== "recolectada" && s.estado !== "cancelada" && (
                                <div className="bg-white p-3 rounded-xl border flex flex-col gap-2">
                                  <select
                                    className="p-2 rounded-lg border bg-white text-xs font-bold"
                                    value={recolectorSel[s.id] || s.recolector_id || ""}
                                    onFocus={() => hablar(`Selecciona el ${rolNecesario} aprobado`)}
                                    onChange={(e) =>
                                      setRecolectorSel({ ...recolectorSel, [s.id]: Number(e.target.value) })
                                    }
                                  >
                                    <option value="">1. Asignar {rolNecesario} aprobado...</option>
                                    {equipoAprobado.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.nombre} ({r.vehiculo_herramienta || "Sin vehículo"})
                                      </option>
                                    ))}
                                  </select>

                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="date"
                                      className="p-2 rounded-lg border bg-white text-xs"
                                      value={fechaSel[s.id] || s.fecha_programada || ""}
                                      onFocus={() => hablar("Selecciona la fecha")}
                                      onChange={(e) => setFechaSel({ ...fechaSel, [s.id]: e.target.value })}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Hora asignada"
                                      className="p-2 rounded-lg border bg-white text-xs"
                                      value={horaSel[s.id] || s.hora_programada || ""}
                                      onFocus={() => hablar("Escribe la hora asignada")}
                                      onChange={(e) => setHoraSel({ ...horaSel, [s.id]: e.target.value })}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        programarSolicitud(s.id);
                                        setTimeout(refrescarSolicitudesAdmin, 400);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-2 rounded-xl text-xs"
                                    >
                                      📅 Programar y WhatsApp
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        cerrarRecoleccion(s.id);
                                        setTimeout(refrescarSolicitudesAdmin, 400);
                                      }}
                                      className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-2 px-2 rounded-xl text-xs"
                                    >
                                      ✅ Marcar Completada
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {recoleccionFiltrada.length === 0 && equipoFiltrado.length === 0 && (
                      <p className="bg-stone-50 p-4 rounded-xl border text-xs font-bold text-stone-600 text-center">
                        No hay registros en "{filtroAdminSol}" con los filtros seleccionados.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* SECCION INFERIOR 1: EQUIPO OPERATIVO */}
              <div className="bg-white p-4 rounded-2xl border-2 border-stone-400 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <div>
                    <h2 className="font-black text-base text-stone-900">
                      👷 Equipo Operativo ({usuarios.length})
                    </h2>
                    <p className="text-xs text-stone-600">
                      Huerteros, recicladores y coordinadores registrados en EcoConecta.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      hablar(
                        `Sección Equipo Operativo. Hay ${usuarios.length} integrantes registrados. Aquí puedes aprobar perfiles pendientes, editar sus datos o eliminarlos.`
                      )
                    }
                    className="bg-stone-100 text-stone-900 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-stone-400"
                  >
                    🔊 Escuchar
                  </button>
                </div>

                {usuarios.map((u) => (
                  <div key={u.id} className="bg-stone-50 p-3.5 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-black bg-stone-200 px-2 py-0.5 rounded uppercase mr-2">
                          {u.rol}
                        </span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded ${
                            u.aprobado ? "bg-emerald-100 text-emerald-900" : "bg-amber-200 text-amber-950"
                          }`}
                        >
                          {u.aprobado ? "✅ Aprobado" : "⏳ Pendiente de Aprobación"}
                        </span>
                        <p className="font-black text-sm mt-1">{u.nombre}</p>
                        <p className="text-xs text-stone-600">
                          Usuario: <strong>{u.username}</strong> • 📱 WhatsApp: +{u.telefono} • 📍 {u.direccion}
                        </p>
                        {u.vehiculo_herramienta && (
                          <p className="text-xs text-emerald-900 font-bold">🚛 Equipo: {u.vehiculo_herramienta}</p>
                        )}
                        {u.requerimientos_operativos && (
                          <p className="text-xs text-stone-700">📝 Requerimientos: {u.requerimientos_operativos}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            hablar(
                              `Integrante ${u.nombre}, rol ${u.rol}, estado ${
                                u.aprobado ? "aprobado" : "pendiente de aprobación"
                              }, dirección ${u.direccion}.`
                            )
                          }
                          className="bg-amber-100 text-amber-950 font-bold text-xs px-3 py-1.5 rounded-lg"
                        >
                          🔊 Escuchar
                        </button>
                        {!u.aprobado && (
                          <button
                            type="button"
                            onClick={() => aprobarOEditarUsuario(u, true)}
                            className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
                          >
                            ✅ Aprobar Perfil
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => abrirEditorUsuario(u)}
                          className="bg-sky-100 text-sky-900 font-bold text-xs px-3 py-1.5 rounded-lg"
                        >
                          ✏️ Editar
                        </button>
                        {!["admin", "coord_huerteros", "coord_recicladores"].includes(u.username) && (
                          <button
                            type="button"
                            onClick={() => eliminarUsuario(u)}
                            className="bg-red-100 text-red-900 font-bold text-xs px-3 py-1.5 rounded-lg"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>

                    {editandoUserId === u.id && (
                      <div className="bg-white p-3 rounded-xl border flex flex-col gap-2">
                        <input type="text" value={editUserNombre} onFocus={() => hablar("Editar nombre completo")} onChange={(e) => setEditUserNombre(e.target.value)} placeholder="Nombre" className="p-2 border rounded text-xs" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={editUserUsername} onFocus={() => hablar("Editar nombre de usuario")} onChange={(e) => setEditUserUsername(e.target.value)} placeholder="Usuario" className="p-2 border rounded text-xs" />
                          <input type="password" value={editUserPass} onFocus={() => hablar("Escribir nueva contraseña opcional")} onChange={(e) => setEditUserPass(e.target.value)} placeholder="Nueva clave (opcional)" className="p-2 border rounded text-xs" />
                        </div>
                        <select value={editUserRol} onFocus={() => hablar("Seleccionar rol del integrante")} onChange={(e) => setEditUserRol(e.target.value)} className="p-2 border rounded text-xs bg-white font-bold">
                          <option value="admin">admin</option>
                          <option value="coord_huerteros">coord_huerteros</option>
                          <option value="coord_recicladores">coord_recicladores</option>
                          <option value="huertero">huertero</option>
                          <option value="reciclador">reciclador</option>
                        </select>
                        <input type="text" value={editUserTel} onFocus={() => hablar("Editar número de WhatsApp")} onChange={(e) => setEditUserTel(e.target.value)} placeholder="WhatsApp" className="p-2 border rounded text-xs" />
                        <input type="text" value={editUserDir} onFocus={() => hablar("Editar dirección o manzana y casa")} onChange={(e) => setEditUserDir(e.target.value)} placeholder="Dirección" className="p-2 border rounded text-xs" />
                        <input type="text" value={editUserVehiculo} onFocus={() => hablar("Editar vehículo o herramienta")} onChange={(e) => setEditUserVehiculo(e.target.value)} placeholder="Vehículo/Herramienta" className="p-2 border rounded text-xs" />
                        <input type="text" value={editUserReq} onFocus={() => hablar("Editar requerimientos operativos")} onChange={(e) => setEditUserReq(e.target.value)} placeholder="Requerimientos" className="p-2 border rounded text-xs" />
                        <button
                          type="button"
                          onClick={() => aprobarOEditarUsuario(u)}
                          className="bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* SECCION INFERIOR 2: CUADRO GUIADO PARA NUEVO INTEGRANTE */}
              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-600 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base text-emerald-950">➕ Nuevo Integrante</h3>
                    <p className="text-xs text-stone-600">
                      Toca cada cuadro para escuchar la instrucción de voz antes de escribir.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      hablar(
                        "Cuadro para agregar un nuevo integrante al equipo. Toca cada casilla para escuchar qué dato debes escribir y al terminar presiona Guardar y Activar Integrante."
                      )
                    }
                    className="bg-emerald-100 text-emerald-950 font-extrabold text-xs px-3 py-2 rounded-xl border border-emerald-600"
                  >
                    🔊 Escuchar guía
                  </button>
                </div>

                <select
                  value={nuevoStaffRol}
                  onFocus={() =>
                    hablar(
                      "Paso uno: selecciona el rol del nuevo integrante, puede ser Huertero, Reciclador, Coordinador de Huerteros, Coordinador de Recicladores o Administrador."
                    )
                  }
                  onChange={(e) => {
                    setNuevoStaffRol(e.target.value);
                    hablar(`Rol seleccionado: ${e.target.value}`);
                  }}
                  className="p-3 border-2 border-emerald-500 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="huertero">Huertero (Residuos Orgánicos)</option>
                  <option value="reciclador">Reciclador (Residuos Reciclables)</option>
                  <option value="coord_huerteros">Coordinador de Huerteros</option>
                  <option value="coord_recicladores">Coordinador de Recicladores</option>
                  <option value="admin">Administrador</option>
                </select>

                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={nuevoStaffNombre}
                  onFocus={() => hablar("Paso dos: escribe el nombre completo del nuevo integrante.")}
                  onChange={(e) => setNuevoStaffNombre(e.target.value)}
                  className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Usuario *"
                    value={nuevoStaffUser}
                    onFocus={() => hablar("Paso tres: escribe un nombre de usuario para iniciar sesión.")}
                    onChange={(e) => setNuevoStaffUser(e.target.value)}
                    className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña *"
                    value={nuevoStaffPass}
                    onFocus={() => hablar("Paso cuatro: escribe una contraseña fácil de recordar.")}
                    onChange={(e) => setNuevoStaffPass(e.target.value)}
                    className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                  />
                </div>

                <input
                  type="tel"
                  placeholder="Número de WhatsApp *"
                  value={nuevoStaffTel}
                  onFocus={() => hablar("Paso cinco: escribe el número de WhatsApp del integrante.")}
                  onChange={(e) => setNuevoStaffTel(e.target.value)}
                  className="p-3 border-2 border-green-500 rounded-xl text-xs font-bold"
                />

                <input
                  type="text"
                  placeholder="Dirección o Manzana / Casa *"
                  value={nuevoStaffDir}
                  onFocus={() => hablar("Paso seis: escribe la dirección, manzana y casa del integrante.")}
                  onChange={(e) => setNuevoStaffDir(e.target.value)}
                  className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                />

                <input
                  type="text"
                  placeholder="Vehículo o herramienta de trabajo"
                  value={nuevoStaffVehiculo}
                  onFocus={() =>
                    hablar("Paso siete: escribe qué vehículo o herramienta de trabajo tiene, como carretilla, triciclo o motocarro.")
                  }
                  onChange={(e) => setNuevoStaffVehiculo(e.target.value)}
                  className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                />

                <input
                  type="text"
                  placeholder="Requerimientos operativos, horarios o sectores"
                  value={nuevoStaffReq}
                  onFocus={() =>
                    hablar("Paso ocho: escribe sus horarios disponibles, sectores y capacidad de recolección.")
                  }
                  onChange={(e) => setNuevoStaffReq(e.target.value)}
                  className="p-3 border-2 border-stone-300 rounded-xl text-xs"
                />

                <button
                  type="button"
                  onClick={() => {
                    hablar("Guardando y activando nuevo integrante en el equipo operativo.");
                    crearUsuarioDesdeStaff(nuevoStaffRol);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 rounded-xl text-xs"
                >
                  ✅ Guardar y Activar Integrante
                </button>
              </div>

              {/* CONFIGURACION ADICIONAL DEL ADMINISTRADOR */}
              {renderTarjetaConfigWhatsApp()}

              <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
                <h3 className="font-black text-sm">Puntos por Recolección</h3>
                {reglasPuntos.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-xl border">
                    <span className="font-bold text-xs uppercase">{r.flujo}</span>
                    <input
                      type="number"
                      className="w-20 p-1.5 border rounded font-bold text-center text-sm"
                      value={puntosEdit[r.flujo] ?? r.puntos_base}
                      onFocus={() => hablar(`Puntos base para ${r.flujo}`)}
                      onChange={(e) =>
                        setPuntosEdit({ ...puntosEdit, [r.flujo]: Number(e.target.value) })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => guardarReglaPuntos(r)}
                      className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      Guardar
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
                <h3 className="font-black text-sm">Publicar Guía Educativa</h3>
                <input
                  type="text"
                  placeholder="Título"
                  className="p-2 border rounded text-sm"
                  value={nuevoTituloEdu}
                  onFocus={() => hablar("Escribe el título de la guía educativa")}
                  onChange={(e) => setNuevoTituloEdu(e.target.value)}
                />
                <select
                  className="p-2 border rounded text-sm"
                  value={nuevoFlujoEdu}
                  onFocus={() => hablar("Selecciona si la guía es para residuos orgánicos o reciclables")}
                  onChange={(e) => setNuevoFlujoEdu(e.target.value)}
                >
                  <option value="organico">Orgánico</option>
                  <option value="reciclable">Reciclable</option>
                </select>
                <textarea
                  placeholder="Texto educativo..."
                  className="p-2 border rounded text-sm"
                  rows={2}
                  value={nuevoTextoEdu}
                  onFocus={() => hablar("Escribe el contenido de la guía educativa")}
                  onChange={(e) => setNuevoTextoEdu(e.target.value)}
                />
                <button
                  type="button"
                  onClick={crearContenidoEducativo}
                  className="bg-sky-700 text-white font-bold py-2 rounded-xl text-xs"
                >
                  Publicar Guía
                </button>
              </div>
            </section>
          );
        })()}
      </div>
    </main>
  );
}

