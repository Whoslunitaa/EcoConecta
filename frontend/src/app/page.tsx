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
  const [modoCalendario, setModoCalendario] = useState<"dia" | "semana" | "mes">("semana");
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
      setFiltroAdminSol("pendientes");
      setSubFiltroCategoria("todo");
      setSubFiltroFlujo("todos");
    }
  }, [usuarioIdActual, usuarioRolActual]);

  useEffect(() => {
    if (!usuarioIdActual || !usuarioRolActual) return;
    if (usuarioRolActual === "admin") {
      setFiltroAdminSol("pendientes");
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
  const [fechaPreferidaSol, setFechaPreferidaSol] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [ubicacionGps, setUbicacionGps] = useState<string>("");
  const [grabandoCampo, setGrabandoCampo] = useState<"direccion" | "nota" | null>(null);
  const [mensajeSistema, setMensajeSistema] = useState<string>("");
  useEffect(() => {
    if (mensajeSistema && mensajeSistema.trim().length > 0) {
      hablar(mensajeSistema); // lectura-automatica-mensajes
    }
  }, [mensajeSistema]);
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
  const [audioFechaPreferida, setAudioFechaPreferida] = useState<string>(() => new Date().toISOString().slice(0, 10));
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
      setFiltroAdminSol("pendientes");
      setSubFiltroCategoria("todo");
      setSubFiltroFlujo("todos");
    }
  }, [usuarioIdActual, usuarioRolActual]);

  useEffect(() => {
    if (!usuarioIdActual || !usuarioRolActual) return;
    if (usuarioRolActual === "admin") {
      setFiltroAdminSol("pendientes");
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
        descripcion: `${observacionVoz || `Entrega de residuos ${flujo}`}${fechaPreferidaSol ? ` | Fecha solicitada: ${fechaPreferidaSol}` : ""}`,
        fecha_preferida: fechaPreferidaSol,
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
        descripcion: `${audioResumenEscuchado.trim()}${audioFechaPreferida ? ` | Fecha solicitada: ${audioFechaPreferida}` : ""}`,
        fecha_preferida: audioFechaPreferida,
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
    const normH = (v: string) => {
      const limpio = v.trim().toUpperCase().replace(/\s+/g, "");
      const m = limpio.match(/^0?(\d{1,2})(?::(\d{2}))?(AM|PM)?$/);
      if (!m) return limpio;
      let hNum = Number(m[1]);
      const mins = m[2] || "00";
      let suf = m[3] || "";
      if (!suf) {
        if (hNum >= 13 && hNum <= 23) {
          hNum -= 12;
          suf = "PM";
        } else if (hNum === 12) {
          suf = "PM";
        } else if (hNum >= 6 && hNum <= 11) {
          suf = "AM";
        } else if (hNum >= 1 && hNum <= 5) {
          suf = "PM";
        }
      }
      return `${hNum}:${mins}${suf}`;
    };
    if (!hora) {
      const avisoSinHora = "Selecciona una hora disponible en el menú desplegable antes de programar.";
      setMensajeSistema(avisoSinHora);
      hablar(avisoSinHora);
      return;
    }
    const conflictoHorario = solicitudes.find(
      (s) =>
        s.id !== solId &&
        s.estado !== "cancelada" &&
        Number(s.recolector_id) === Number(recId) &&
        String(s.fecha_programada || "").trim() === String(fecha).trim() &&
        normH(String(s.hora_programada || "")) === normH(String(hora)) &&
        normH(String(hora)) !== ""
    );
    const conflictoDescanso = descansosCalendario.find(
      (d) =>
        Number(d.usuarioId) === Number(recId) &&
        String(d.fecha || "").trim() === String(fecha).trim() &&
        normH(String(d.hora || "")) === normH(String(hora)) &&
        normH(String(hora)) !== ""
    );
    if (conflictoDescanso) {
      const avisoDesc = `No es posible agendar a ${conflictoDescanso.nombre} el ${fecha} a las ${hora} porque tiene un descanso registrado en esa hora.`;
      setMensajeSistema(avisoDesc);
      hablar(avisoDesc);
      return;
    }
    if (conflictoHorario) {
      const empNombre = usuarios.find((u) => Number(u.id) === Number(recId))?.nombre || "este encargado";
      const aviso = `No es posible agendar a ${empNombre} el ${fecha} a las ${hora}; ya tiene una visita asignada en ese mismo día y hora. Puedes agendar a otro integrante o elegir otra hora.`;
      setMensajeSistema(aviso);
      hablar(aviso);
      return;
    }
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
        {renderSelectorHoraDisponible(s, "text-sm")}
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
                  {renderSelectorHoraDisponible(s, "text-sm")}
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

