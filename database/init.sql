--
-- PostgreSQL database dump
--

\restrict zkHlgKOd1kokfPtHBsCC2n4c3zrtvUkRBzYDqMmGzQb4dsDqKCbDTYsPg5F2ZY7

-- Dumped from database version 16.16
-- Dumped by pg_dump version 16.16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_solicitante_id_fkey;
ALTER TABLE IF EXISTS ONLY public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_recolector_id_fkey;
ALTER TABLE IF EXISTS ONLY public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_coordinador_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historial_estados DROP CONSTRAINT IF EXISTS historial_estados_solicitud_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historial_estados DROP CONSTRAINT IF EXISTS historial_estados_actor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_username_key;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_pkey;
ALTER TABLE IF EXISTS ONLY public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_codigo_key;
ALTER TABLE IF EXISTS ONLY public.sesiones_whatsapp DROP CONSTRAINT IF EXISTS sesiones_whatsapp_pkey;
ALTER TABLE IF EXISTS ONLY public.reglas_puntos DROP CONSTRAINT IF EXISTS reglas_puntos_pkey;
ALTER TABLE IF EXISTS ONLY public.reglas_puntos DROP CONSTRAINT IF EXISTS reglas_puntos_flujo_key;
ALTER TABLE IF EXISTS ONLY public.historial_estados DROP CONSTRAINT IF EXISTS historial_estados_pkey;
ALTER TABLE IF EXISTS ONLY public.contenidos_educativos DROP CONSTRAINT IF EXISTS contenidos_educativos_pkey;
ALTER TABLE IF EXISTS ONLY public.configuracion_sistema DROP CONSTRAINT IF EXISTS configuracion_sistema_pkey;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.solicitudes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reglas_puntos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.historial_estados ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contenidos_educativos ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.solicitudes_id_seq;
DROP TABLE IF EXISTS public.solicitudes;
DROP TABLE IF EXISTS public.sesiones_whatsapp;
DROP SEQUENCE IF EXISTS public.reglas_puntos_id_seq;
DROP TABLE IF EXISTS public.reglas_puntos;
DROP SEQUENCE IF EXISTS public.historial_estados_id_seq;
DROP TABLE IF EXISTS public.historial_estados;
DROP SEQUENCE IF EXISTS public.contenidos_educativos_id_seq;
DROP TABLE IF EXISTS public.contenidos_educativos;
DROP TABLE IF EXISTS public.configuracion_sistema;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: configuracion_sistema; Type: TABLE; Schema: public; Owner: ecoconecta
--

CREATE TABLE public.configuracion_sistema (
    clave character varying(60) NOT NULL,
    valor text DEFAULT ''::text NOT NULL,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.configuracion_sistema OWNER TO ecoconecta;

--
-- Name: contenidos_educativos; Type: TABLE; Schema: public; Owner: ecoconecta
--

CREATE TABLE public.contenidos_educativos (
    id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    flujo character varying(20) NOT NULL,
    icono character varying(30) DEFAULT '??'::character varying NOT NULL,
    texto_visual text NOT NULL,
    guion_audio text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT contenidos_educativos_flujo_check CHECK (((flujo)::text = ANY ((ARRAY['organico'::character varying, 'reciclable'::character varying, 'general'::character varying])::text[])))
);


ALTER TABLE public.contenidos_educativos OWNER TO ecoconecta;

--
-- Name: contenidos_educativos_id_seq; Type: SEQUENCE; Schema: public; Owner: ecoconecta
--

CREATE SEQUENCE public.contenidos_educativos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contenidos_educativos_id_seq OWNER TO ecoconecta;

--
-- Name: contenidos_educativos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecoconecta
--

ALTER SEQUENCE public.contenidos_educativos_id_seq OWNED BY public.contenidos_educativos.id;


--
-- Name: historial_estados; Type: TABLE; Schema: public; Owner: ecoconecta
--

CREATE TABLE public.historial_estados (
    id integer NOT NULL,
    solicitud_id integer NOT NULL,
    estado_anterior character varying(30),
    estado_nuevo character varying(30) NOT NULL,
    actor_id integer NOT NULL,
    observacion text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.historial_estados OWNER TO ecoconecta;

--
-- Name: historial_estados_id_seq; Type: SEQUENCE; Schema: public; Owner: ecoconecta
--

CREATE SEQUENCE public.historial_estados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_estados_id_seq OWNER TO ecoconecta;

--
-- Name: historial_estados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecoconecta
--

ALTER SEQUENCE public.historial_estados_id_seq OWNED BY public.historial_estados.id;


--
-- Name: reglas_puntos; Type: TABLE; Schema: public; Owner: ecoconecta
--

CREATE TABLE public.reglas_puntos (
    id integer NOT NULL,
    flujo character varying(20) NOT NULL,
    puntos_base integer NOT NULL,
    descripcion text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT reglas_puntos_flujo_check CHECK (((flujo)::text = ANY ((ARRAY['organico'::character varying, 'reciclable'::character varying])::text[])))
);


ALTER TABLE public.reglas_puntos OWNER TO ecoconecta;

--
-- Name: reglas_puntos_id_seq; Type: SEQUENCE; Schema: public; Owner: ecoconecta
--

CREATE SEQUENCE public.reglas_puntos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reglas_puntos_id_seq OWNER TO ecoconecta;

--
-- Name: reglas_puntos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecoconecta
--

ALTER SEQUENCE public.reglas_puntos_id_seq OWNED BY public.reglas_puntos.id;


--
-- Name: sesiones_whatsapp; Type: TABLE; Schema: public; Owner: ecoconecta
--

CREATE TABLE public.sesiones_whatsapp (
    telefono character varying(30) NOT NULL,
    paso character varying(30) DEFAULT 'esperando_flujo'::character varying NOT NULL,
    flujo character varying(20),
    direccion character varying(200),
    horario character varying(100),
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nombre character varying(120),
    cantidad_aproximada character varying(120),
    sector_usuario character varying(120),
    fecha_preferida character varying(60),
    media_id_imagen character varying(120) DEFAULT ''::character varying,
    transcripcion_audio text DEFAULT ''::text
);


ALTER TABLE public.sesiones_whatsapp OWNER TO ecoconecta;

--
-- Name: solicitudes; Type: TABLE; Schema: public; Owner: ecoconecta
--

CREATE TABLE public.solicitudes (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    solicitante_id integer NOT NULL,
    flujo character varying(20) NOT NULL,
    direccion_entrega character varying(200) NOT NULL,
    telefono_contacto character varying(30) NOT NULL,
    ubicacion_gps character varying(100) DEFAULT ''::character varying,
    descripcion text DEFAULT ''::text,
    disponibilidad_horaria character varying(100) NOT NULL,
    canal_origen character varying(20) DEFAULT 'web'::character varying NOT NULL,
    estado character varying(30) DEFAULT 'recibida'::character varying NOT NULL,
    coordinador_id integer,
    recolector_id integer,
    fecha_programada date,
    hora_programada character varying(50),
    puntos_otorgados integer DEFAULT 0,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nombre_contacto character varying(120) DEFAULT ''::character varying,
    cantidad_aproximada character varying(120) DEFAULT ''::character varying,
    sector_usuario character varying(120) DEFAULT ''::character varying,
    media_id_imagen character varying(120) DEFAULT ''::character varying,
    transcripcion_audio text DEFAULT ''::text,
    CONSTRAINT solicitudes_estado_check CHECK (((estado)::text = ANY ((ARRAY['recibida'::character varying, 'en_revision'::character varying, 'programada'::character varying, 'recolectada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT solicitudes_flujo_check CHECK (((flujo)::text = ANY ((ARRAY['organico'::character varying, 'reciclable'::character varying])::text[])))
);


ALTER TABLE public.solicitudes OWNER TO ecoconecta;

--
-- Name: solicitudes_id_seq; Type: SEQUENCE; Schema: public; Owner: ecoconecta
--

CREATE SEQUENCE public.solicitudes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitudes_id_seq OWNER TO ecoconecta;

--
-- Name: solicitudes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecoconecta
--

ALTER SEQUENCE public.solicitudes_id_seq OWNED BY public.solicitudes.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: ecoconecta
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(120) NOT NULL,
    username character varying(60) NOT NULL,
    password_hash character varying(200) NOT NULL,
    telefono character varying(30) NOT NULL,
    direccion character varying(200) NOT NULL,
    sector_manzana character varying(100) NOT NULL,
    rol character varying(30) NOT NULL,
    vehiculo_herramienta character varying(120) DEFAULT ''::character varying,
    requerimientos_operativos text DEFAULT ''::text,
    aprobado boolean DEFAULT true NOT NULL,
    es_piloto boolean DEFAULT true NOT NULL,
    puntos_acumulados integer DEFAULT 0 NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['solicitante_hogar'::character varying, 'unidad_productiva'::character varying, 'coord_huerteros'::character varying, 'coord_recicladores'::character varying, 'huertero'::character varying, 'reciclador'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO ecoconecta;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: ecoconecta
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO ecoconecta;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ecoconecta
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: contenidos_educativos id; Type: DEFAULT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.contenidos_educativos ALTER COLUMN id SET DEFAULT nextval('public.contenidos_educativos_id_seq'::regclass);


--
-- Name: historial_estados id; Type: DEFAULT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.historial_estados ALTER COLUMN id SET DEFAULT nextval('public.historial_estados_id_seq'::regclass);


--
-- Name: reglas_puntos id; Type: DEFAULT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.reglas_puntos ALTER COLUMN id SET DEFAULT nextval('public.reglas_puntos_id_seq'::regclass);


--
-- Name: solicitudes id; Type: DEFAULT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.solicitudes ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: configuracion_sistema; Type: TABLE DATA; Schema: public; Owner: ecoconecta
--

INSERT INTO public.configuracion_sistema VALUES ('whatsapp_oficial_numero', '', '2026-11-21 00:34:57.254632');


--
-- Data for Name: contenidos_educativos; Type: TABLE DATA; Schema: public; Owner: ecoconecta
--

INSERT INTO public.contenidos_educativos VALUES (1, 'Residuos Orgánicos para la Huerta', 'organico', '🌱', 'Cáscaras de frutas, verduras y restos de comida cruda. Van limpios sin bolsas plásticas para hacer abono.', 'Residuos orgánicos para la huerta. Separa cáscaras de frutas, verduras y restos de comida sin bolsas plásticas.', true);
INSERT INTO public.contenidos_educativos VALUES (2, 'Residuos Reciclables Limpios', 'reciclable', '♻', 'Botellas plásticas vacías, cartón seco, papel limpio y latas. Aplástalos para ahorrar espacio.', 'Residuos reciclables. Guarda botellas plásticas vacías, cartón seco, papel y latas limpias.', true);
INSERT INTO public.contenidos_educativos VALUES (3, 'Cómo funciona EcoConecta', 'general', '📲', '1. Pide recolección o escribe al WhatsApp. 2. El coordinador programa día y hora. 3. Ganas puntos al entregar.', 'Cómo funciona EcoConecta. Pides la recolección, el coordinador programa día y hora, y ganas puntos.', true);
INSERT INTO public.contenidos_educativos VALUES (7, 'Cuidado con lo que NO va y horarios', 'general', '⚠', 'No mezcles residuos mojados o sucios con el reciclaje ni eches plásticos a la huerta. Coordina día y hora con el equipo.', 'Cuidado con lo que no va y horarios. No mezcles residuos sucios con reciclaje y acuerda día y hora de entrega.', true);
INSERT INTO public.contenidos_educativos VALUES (8, 'Separación por canecas en casa y negocio', 'general', '🗑', 'Caneca orgánica: restos de comida cruda y cáscaras. Caneca reciclable: plástico, cartón, papel y latas limpias. Caneca no aprovechable: servilletas sucias, icopor o empaques mixtos.', 'Separación por canecas. Separa orgánicos para la huerta, reciclables limpios y secos, y deja aparte lo no aprovechable.', true);


--
-- Data for Name: historial_estados; Type: TABLE DATA; Schema: public; Owner: ecoconecta
--

INSERT INTO public.historial_estados VALUES (1, 1, NULL, 'recibida', 11, 'Solicitud registrada vía WEB por Mari en casa uni y enviada a Carlos Mendoza (Coord. Huerteros).', '2026-11-21 00:48:01.33361');
INSERT INTO public.historial_estados VALUES (2, 2, NULL, 'programada', 11, 'Solicitud creada por Camilo (WhatsApp Cloud API). Cantidad: 1 bolsa mediana. Asignada automáticamente por sector a Don Jos? Cantillo (Huertero).', '2026-11-21 00:49:07.686458');
INSERT INTO public.historial_estados VALUES (3, 2, 'programada', 'recolectada', 4, 'Recolección confirmada en sitio. (+15 puntos)', '2026-11-21 00:54:51.25918');


--
-- Data for Name: reglas_puntos; Type: TABLE DATA; Schema: public; Owner: ecoconecta
--

INSERT INTO public.reglas_puntos VALUES (1, 'organico', 15, 'Entrega verificada de residuos orgánicos separados para compostaje', true);
INSERT INTO public.reglas_puntos VALUES (2, 'reciclable', 10, 'Entrega verificada de material reciclable limpio y seco', true);


--
-- Data for Name: sesiones_whatsapp; Type: TABLE DATA; Schema: public; Owner: ecoconecta
--



--
-- Data for Name: solicitudes; Type: TABLE DATA; Schema: public; Owner: ecoconecta
--

INSERT INTO public.solicitudes VALUES (1, 'ORG-0001', 11, 'organico', 'casa uni', '573237083547', '', 'organicos', 'Mañana (8:00 AM - 12:00 PM)', 'web', 'recibida', 3, NULL, NULL, NULL, 0, '2026-11-21 00:48:01.33361', '2026-11-21 00:48:01.33361', 'Mari', '', '', '', '');
INSERT INTO public.solicitudes VALUES (2, 'ORG-0002', 11, 'organico', 'universidad', '573237084547', '', 'Cantidad aprox: 1 bolsa mediana | Fecha solicitada: 2026-11-21', 'Mañana (8:00 AM - 12:00 PM)', 'whatsapp_cloud', 'recolectada', 3, 4, '2026-11-21', 'Mañana (8:00 AM - 12:00 PM)', 15, '2026-11-21 00:49:07.686458', '2026-11-21 00:54:51.25918', 'Mari', '1 bolsa mediana', 'universidad', '', '');


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: ecoconecta
--

INSERT INTO public.usuarios VALUES (11, 'Comunidad Villas de San Pablo', 'comunidad_vsp', 'vsp_directo_2026', '573000000000', 'Villas de San Pablo', 'Villas de San Pablo', 'solicitante_hogar', '', 'Canal directo ciudadano', true, true, 0, '2026-11-21 00:34:57.254632');
INSERT INTO public.usuarios VALUES (1, 'Doña María Pérez (Hogar)', 'maria', '1234', '573001110001', 'Manzana 4 Casa 12, Villas de San Pablo', 'Manzana 4', 'solicitante_hogar', '', 'Hogar piloto', true, true, 20, '2026-11-21 00:34:45.01486');
INSERT INTO public.usuarios VALUES (2, 'Tienda El Progreso (Comercio)', 'progreso', '1234', '573001110002', 'Manzana 8 Local 2, Villas de San Pablo', 'Manzana 8', 'unidad_productiva', '', 'Contenedor orgánico diario', true, true, 45, '2026-11-21 00:34:45.01486');
INSERT INTO public.usuarios VALUES (3, 'Carlos Mendoza (Coord. Huerteros)', 'coord_huerteros', '1234', '573001110003', 'Huerta Comunitaria Villas de San Pablo', 'Sector Huerta', 'coord_huerteros', 'Coordinación', 'Control total flujo orgánico', true, true, 0, '2026-11-21 00:34:45.01486');
INSERT INTO public.usuarios VALUES (4, 'Don José Cantillo (Huertero)', 'jose_huertero', '1234', '573001110004', 'Manzana 3 Casa 5, Villas de San Pablo', 'Manzana 3', 'huertero', 'Carretilla y motocarro', 'Disponible mañanas y tardes', true, true, 0, '2026-11-21 00:34:45.01486');
INSERT INTO public.usuarios VALUES (5, 'Ana Torres (Coord. Recicladores)', 'coord_recicladores', '1234', '573001110005', 'Punto Ecológico Central, Villas de San Pablo', 'Sector Central', 'coord_recicladores', 'Coordinación', 'Control total flujo reciclable', true, true, 0, '2026-11-21 00:34:45.01486');
INSERT INTO public.usuarios VALUES (6, 'Doña Carmen Ruiz (Recicladora)', 'carmen_recicladora', '1234', '573001110006', 'Manzana 10 Casa 18, Villas de San Pablo', 'Manzana 10', 'reciclador', 'Carretilla con costales', 'Rutas reciclaje seco', true, true, 0, '2026-11-21 00:34:45.01486');
INSERT INTO public.usuarios VALUES (7, 'Administrador FSD / Unilibre', 'admin', '1234', '573001110007', 'Centro Comunitario Villas de San Pablo', 'General', 'admin', 'Administración', 'Gestión general', true, true, 0, '2026-11-21 00:34:45.01486');


--
-- Name: contenidos_educativos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ecoconecta
--

SELECT pg_catalog.setval('public.contenidos_educativos_id_seq', 8, true);


--
-- Name: historial_estados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ecoconecta
--

SELECT pg_catalog.setval('public.historial_estados_id_seq', 3, true);


--
-- Name: reglas_puntos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ecoconecta
--

SELECT pg_catalog.setval('public.reglas_puntos_id_seq', 4, true);


--
-- Name: solicitudes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ecoconecta
--

SELECT pg_catalog.setval('public.solicitudes_id_seq', 2, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ecoconecta
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 18, true);


--
-- Name: configuracion_sistema configuracion_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.configuracion_sistema
    ADD CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (clave);


--
-- Name: contenidos_educativos contenidos_educativos_pkey; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.contenidos_educativos
    ADD CONSTRAINT contenidos_educativos_pkey PRIMARY KEY (id);


--
-- Name: historial_estados historial_estados_pkey; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.historial_estados
    ADD CONSTRAINT historial_estados_pkey PRIMARY KEY (id);


--
-- Name: reglas_puntos reglas_puntos_flujo_key; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.reglas_puntos
    ADD CONSTRAINT reglas_puntos_flujo_key UNIQUE (flujo);


--
-- Name: reglas_puntos reglas_puntos_pkey; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.reglas_puntos
    ADD CONSTRAINT reglas_puntos_pkey PRIMARY KEY (id);


--
-- Name: sesiones_whatsapp sesiones_whatsapp_pkey; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.sesiones_whatsapp
    ADD CONSTRAINT sesiones_whatsapp_pkey PRIMARY KEY (telefono);


--
-- Name: solicitudes solicitudes_codigo_key; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_codigo_key UNIQUE (codigo);


--
-- Name: solicitudes solicitudes_pkey; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: historial_estados historial_estados_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.historial_estados
    ADD CONSTRAINT historial_estados_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.usuarios(id);


--
-- Name: historial_estados historial_estados_solicitud_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.historial_estados
    ADD CONSTRAINT historial_estados_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE;


--
-- Name: solicitudes solicitudes_coordinador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_coordinador_id_fkey FOREIGN KEY (coordinador_id) REFERENCES public.usuarios(id);


--
-- Name: solicitudes solicitudes_recolector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_recolector_id_fkey FOREIGN KEY (recolector_id) REFERENCES public.usuarios(id);


--
-- Name: solicitudes solicitudes_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ecoconecta
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES public.usuarios(id);


--
-- PostgreSQL database dump complete
--

\unrestrict zkHlgKOd1kokfPtHBsCC2n4c3zrtvUkRBzYDqMmGzQb4dsDqKCbDTYsPg5F2ZY7

