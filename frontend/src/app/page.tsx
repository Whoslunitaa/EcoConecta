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

  const hablar = (texto: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!audioHabilitado) return;
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ];
    const textoLimpio = texto
      .replace(/1\uFE0F?\u20E3/g, "opción 1, ")
      .replace(/2\uFE0F?\u20E3/g, "opción 2, ")
      .replace(/3\uFE0F?\u20E3/g, "opción 3, ")
      .replace(/4\uFE0F?\u20E3/g, "opción 4, ")
      .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2300-\u27BF]|[\uFE00-\uFE0F\u200D\u20E3]/g, " ")
      .replace(/\*/g, "")
      .replace(/->/g, ", luego ")
      .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) => {
        const mes = meses[parseInt(m, 10) - 1] || m;
        return `${parseInt(d, 10)} de ${mes} de ${y}`;
      })
      .replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g, (_, d, m, y) => {
        const mes = meses[parseInt(m, 10) - 1] || m;
        return `${parseInt(d, 10)} de ${mes} de ${y}`;
      })
      .replace(/\b1\/2\b/g, "1 o 2")
      .replace(/([A-Za-zÁÉÍÓÚáéíóúÑñ])\s*\/\s*([A-Za-zÁÉÍÓÚáéíóúÑñ])/g, "$1 o $2")
      .replace(/\+57\s*/g, "más 57 ")
      .replace(/\b\d{7,12}\b/g, (num) => num.split("").join(" "))
      .replace(/\s+/g, " ")
      .trim();
    if (!textoLimpio) return;
    window.speechSynthesis.resume();

    const lanzarVoz = () => {
      const utter = new SpeechSynthesisUtterance(textoLimpio);
      const voces = window.speechSynthesis.getVoices();
      const vozEs =
        voces.find((v) => v.lang.toLowerCase().includes("es-co")) ||
        voces.find((v) => v.lang.toLowerCase().includes("es-es")) ||
        voces.find((v) => v.lang.toLowerCase().startsWith("es"));
      if (vozEs) utter.voice = vozEs;
      utter.lang = "es-CO";
      utter.rate = 0.95;
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
    if (!usuarioActual) return;
    const timer = setInterval(() => {
      cargarDatosPrivados(usuarioActual, false);
    }, 4000);
    return () => clearInterval(timer);
  }, [usuarioActual]);

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
      hablar(data.respuesta.replace(/[*🌱♻️🥬📦📍⏰✅1️⃣2️⃣3️⃣•👤]/g, ""));
      if (data.solicitud_creada) {
        const msg = `Solicitud ${data.solicitud_creada.codigo} creada y enviada a la bandeja del Coordinador.`;
        setMensajeSistema(msg);
        if (usuarioActual) cargarDatosPrivados(usuarioActual, false);
      }
    }
  };

  const programarSolicitud = async (solId: number) => {
    if (!usuarioActual) return;
    const recId = recolectorSel[solId];
    const fecha = fechaSel[solId];
    const hora = horaSel[solId];
    if (!recId || !fecha || !hora) {
      hablar("Selecciona el encargado aprobado, el día y la hora.");
      return;
    }
    const api = getApiUrl();
    const res = await fetch(`${api}/solicitudes/${solId}/programar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "rol-actor": usuarioActual.rol,
      },
      body: JSON.stringify({
        coordinador_id: usuarioActual.id,
        recolector_id: recId,
        fecha_programada: fecha,
        hora_programada: hora,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.tel_recolector) {
        setLinkWaDirecto(`https://wa.me/${data.tel_recolector}?text=${encodeURIComponent(data.msg_recolector)}`);
      }
      if (data.tel_vecino) {
        setLinkWaSecundario(`https://wa.me/${data.tel_vecino}?text=${encodeURIComponent(data.msg_vecino)}`);
      }
      const msg = "Tarea programada. Usa los botones verdes para abrir WhatsApp Business y enviar la ubicación, día y hora al encargado y al vecino.";
      setMensajeSistema(msg);
      hablar(msg);
      cargarDatosPrivados(usuarioActual, false);
    } else {
      const err = await res.json();
      hablar(err.detail || "Error al programar.");
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
              onClick={() => hablar(m.texto.replace(/[*🌱♻️🥬📦📍⏰✅1️⃣2️⃣3️⃣•👤]/g, ""))}
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
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-600 flex flex-col gap-2">
                  <h3 className="font-black text-sm">➕ Añadir Nuevo {rolEquipoCoord}</h3>
                  <input type="text" placeholder="Nombre completo *" value={nuevoStaffNombre} onChange={(e) => setNuevoStaffNombre(e.target.value)} className="p-2 border rounded text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Usuario *" value={nuevoStaffUser} onChange={(e) => setNuevoStaffUser(e.target.value)} className="p-2 border rounded text-xs" />
                    <input type="password" placeholder="Contraseña *" value={nuevoStaffPass} onChange={(e) => setNuevoStaffPass(e.target.value)} className="p-2 border rounded text-xs" />
                  </div>
                  <input type="tel" placeholder="Número de WhatsApp *" value={nuevoStaffTel} onChange={(e) => setNuevoStaffTel(e.target.value)} className="p-2 border rounded text-xs" />
                  <input type="text" placeholder="Dirección *" value={nuevoStaffDir} onChange={(e) => setNuevoStaffDir(e.target.value)} className="p-2 border rounded text-xs" />
                  <input type="text" placeholder="Vehículo / Herramienta" value={nuevoStaffVehiculo} onChange={(e) => setNuevoStaffVehiculo(e.target.value)} className="p-2 border rounded text-xs" />
                  <input type="text" placeholder="Requerimientos operativos" value={nuevoStaffReq} onChange={(e) => setNuevoStaffReq(e.target.value)} className="p-2 border rounded text-xs" />
                  <button
                    type="button"
                    onClick={() => crearUsuarioDesdeStaff(rolEquipoCoord)}
                    className="bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Guardar y Activar {rolEquipoCoord}
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
            <h2 className="font-black text-lg">Mis Tareas Asignadas (Vista Limitada)</h2>
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

        {esAdmin && (
          <section className="flex flex-col gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-500">
              <h2 className="font-black text-base">Panel Administrador • Configuración WhatsApp y Aprobaciones</h2>
              <p className="text-xs text-stone-600">
                Configura el número oficial de WhatsApp Business (+57) y aprueba o edita los perfiles de Huerteros y Recicladores.
              </p>
            </div>

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
                  <input type="text" placeholder="Título" className="p-2 border rounded text-sm" value={nuevoTituloEdu} onChange={(e) => setNuevoTituloEdu(e.target.value)} />
                  <select className="p-2 border rounded text-sm" value={nuevoFlujoEdu} onChange={(e) => setNuevoFlujoEdu(e.target.value)}>
                    <option value="organico">Orgánico</option>
                    <option value="reciclable">Reciclable</option>
                  </select>
                  <textarea placeholder="Texto educativo..." className="p-2 border rounded text-sm" rows={2} value={nuevoTextoEdu} onChange={(e) => setNuevoTextoEdu(e.target.value)} />
                  <button
                    type="button"
                    onClick={crearContenidoEducativo}
                    className="bg-sky-700 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Publicar Guía
                  </button>
                </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-600 flex flex-col gap-2">
              <h3 className="font-black text-sm">➕ Añadir Nuevo Usuario o Rol</h3>
              <select
                value={nuevoStaffRol}
                onChange={(e) => setNuevoStaffRol(e.target.value)}
                className="p-2 border rounded text-xs font-bold bg-white"
              >
                <option value="huertero">Huertero</option>
                <option value="reciclador">Reciclador</option>
                <option value="coord_huerteros">Coordinador de Huerteros</option>
                <option value="coord_recicladores">Coordinador de Recicladores</option>
                <option value="admin">Administrador</option>
              </select>
              <input type="text" placeholder="Nombre completo *" value={nuevoStaffNombre} onChange={(e) => setNuevoStaffNombre(e.target.value)} className="p-2 border rounded text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Usuario *" value={nuevoStaffUser} onChange={(e) => setNuevoStaffUser(e.target.value)} className="p-2 border rounded text-xs" />
                <input type="password" placeholder="Contraseña *" value={nuevoStaffPass} onChange={(e) => setNuevoStaffPass(e.target.value)} className="p-2 border rounded text-xs" />
              </div>
              <input type="tel" placeholder="Número de WhatsApp *" value={nuevoStaffTel} onChange={(e) => setNuevoStaffTel(e.target.value)} className="p-2 border rounded text-xs" />
              <input type="text" placeholder="Dirección *" value={nuevoStaffDir} onChange={(e) => setNuevoStaffDir(e.target.value)} className="p-2 border rounded text-xs" />
              <input type="text" placeholder="Vehículo / Herramienta" value={nuevoStaffVehiculo} onChange={(e) => setNuevoStaffVehiculo(e.target.value)} className="p-2 border rounded text-xs" />
              <input type="text" placeholder="Requerimientos operativos" value={nuevoStaffReq} onChange={(e) => setNuevoStaffReq(e.target.value)} className="p-2 border rounded text-xs" />
              <button
                type="button"
                onClick={() => crearUsuarioDesdeStaff(nuevoStaffRol)}
                className="bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs"
              >
                Guardar y Activar Perfil
              </button>
            </div>

            {usuarios.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border-2 border-stone-300 flex flex-col gap-2">
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
                  <div className="bg-stone-50 p-3 rounded-xl border flex flex-col gap-2">
                    <input type="text" value={editUserNombre} onChange={(e) => setEditUserNombre(e.target.value)} placeholder="Nombre" className="p-2 border rounded text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={editUserUsername} onChange={(e) => setEditUserUsername(e.target.value)} placeholder="Usuario" className="p-2 border rounded text-xs" />
                      <input type="password" value={editUserPass} onChange={(e) => setEditUserPass(e.target.value)} placeholder="Nueva clave (opcional)" className="p-2 border rounded text-xs" />
                    </div>
                    <select value={editUserRol} onChange={(e) => setEditUserRol(e.target.value)} className="p-2 border rounded text-xs bg-white font-bold">
                      <option value="admin">admin</option>
                      <option value="coord_huerteros">coord_huerteros</option>
                      <option value="coord_recicladores">coord_recicladores</option>
                      <option value="huertero">huertero</option>
                      <option value="reciclador">reciclador</option>
                    </select>
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
          </section>
        )}
      </div>
    </main>
  );
}