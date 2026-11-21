CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    username VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    sector_manzana VARCHAR(100) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (
        rol IN (
            'solicitante_hogar',
            'unidad_productiva',
            'coord_huerteros',
            'coord_recicladores',
            'huertero',
            'reciclador',
            'admin'
        )
    ),
    vehiculo_herramienta VARCHAR(120) DEFAULT '',
    requerimientos_operativos TEXT DEFAULT '',
    aprobado BOOLEAN NOT NULL DEFAULT TRUE,
    es_piloto BOOLEAN NOT NULL DEFAULT TRUE,
    puntos_acumulados INTEGER NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contenidos_educativos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    flujo VARCHAR(20) NOT NULL CHECK (flujo IN ('organico', 'reciclable', 'general')),
    icono VARCHAR(30) NOT NULL DEFAULT '♻️',
    texto_visual TEXT NOT NULL,
    guion_audio TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reglas_puntos (
    id SERIAL PRIMARY KEY,
    flujo VARCHAR(20) UNIQUE NOT NULL CHECK (flujo IN ('organico', 'reciclable')),
    puntos_base INTEGER NOT NULL,
    descripcion TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS solicitudes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
    flujo VARCHAR(20) NOT NULL CHECK (flujo IN ('organico', 'reciclable')),
    direccion_entrega VARCHAR(200) NOT NULL,
    telefono_contacto VARCHAR(30) NOT NULL,
    ubicacion_gps VARCHAR(100) DEFAULT '',
    descripcion TEXT DEFAULT '',
    disponibilidad_horaria VARCHAR(100) NOT NULL,
    canal_origen VARCHAR(20) NOT NULL DEFAULT 'web',
    estado VARCHAR(30) NOT NULL DEFAULT 'recibida' CHECK (
        estado IN ('recibida', 'en_revision', 'programada', 'recolectada', 'cancelada')
    ),
    coordinador_id INTEGER REFERENCES usuarios(id),
    recolector_id INTEGER REFERENCES usuarios(id),
    fecha_programada DATE,
    hora_programada VARCHAR(50),
    puntos_otorgados INTEGER DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_estados (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    actor_id INTEGER NOT NULL REFERENCES usuarios(id),
    observacion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sesiones_whatsapp (
    telefono VARCHAR(30) PRIMARY KEY,
    paso VARCHAR(30) NOT NULL DEFAULT 'esperando_flujo',
    flujo VARCHAR(20),
    direccion VARCHAR(200),
    horario VARCHAR(100),
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nombre, username, password_hash, telefono, direccion, sector_manzana, rol, vehiculo_herramienta, requerimientos_operativos, aprobado, es_piloto, puntos_acumulados)
VALUES
('Doña María Pérez (Hogar)', 'maria', '1234', '573001110001', 'Manzana 4 Casa 12, Villas de San Pablo', 'Manzana 4', 'solicitante_hogar', '', 'Hogar piloto', TRUE, TRUE, 20),
('Tienda El Progreso (Comercio)', 'progreso', '1234', '573001110002', 'Manzana 8 Local 2, Villas de San Pablo', 'Manzana 8', 'unidad_productiva', '', 'Contenedor orgánico diario', TRUE, TRUE, 45),
('Carlos Mendoza (Coord. Huerteros)', 'coord_huerteros', '1234', '573001110003', 'Huerta Comunitaria Villas de San Pablo', 'Sector Huerta', 'coord_huerteros', 'Coordinación', 'Control total flujo orgánico', TRUE, TRUE, 0),
('Don José Cantillo (Huertero)', 'jose_huertero', '1234', '573001110004', 'Manzana 3 Casa 5, Villas de San Pablo', 'Manzana 3', 'huertero', 'Carretilla y motocarro', 'Disponible mañanas y tardes', TRUE, TRUE, 0),
('Ana Torres (Coord. Recicladores)', 'coord_recicladores', '1234', '573001110005', 'Punto Ecológico Central, Villas de San Pablo', 'Sector Central', 'coord_recicladores', 'Coordinación', 'Control total flujo reciclable', TRUE, TRUE, 0),
('Doña Carmen Ruiz (Recicladora)', 'carmen_recicladora', '1234', '573001110006', 'Manzana 10 Casa 18, Villas de San Pablo', 'Manzana 10', 'reciclador', 'Carretilla con costales', 'Rutas reciclaje seco', TRUE, TRUE, 0),
('Administrador FSD / Unilibre', 'admin', '1234', '573001110007', 'Centro Comunitario Villas de San Pablo', 'General', 'admin', 'Administración', 'Gestión general', TRUE, TRUE, 0)
ON CONFLICT (username) DO NOTHING;

INSERT INTO contenidos_educativos (titulo, flujo, icono, texto_visual, guion_audio)
VALUES
('Residuos Orgánicos para la Huerta', 'organico', '🥬', 'Cáscaras de frutas, verduras y restos de comida cruda. Van limpios sin bolsas plásticas para hacer abono.', 'Residuos orgánicos para la huerta. Separa cáscaras de frutas, verduras y restos de comida sin bolsas plásticas.'),
('Residuos Reciclables Limpios', 'reciclable', '♻️', 'Botellas plásticas vacías, cartón seco, papel limpio y latas. Aplástalos para ahorrar espacio.', 'Residuos reciclables. Guarda botellas plásticas vacías, cartón seco, papel y latas limpias.'),
('Cómo funciona EcoConecta', 'general', '🚛', '1. Pide recolección o escribe al WhatsApp. 2. El coordinador programa día y hora. 3. Ganas puntos al entregar.', 'Cómo funciona EcoConecta. Pides la recolección, el coordinador programa día y hora, y ganas puntos.')
ON CONFLICT DO NOTHING;

INSERT INTO reglas_puntos (flujo, puntos_base, descripcion)
VALUES
('organico', 15, 'Entrega verificada de residuos orgánicos separados para compostaje'),
('reciclable', 10, 'Entrega verificada de material reciclable limpio y seco')
ON CONFLICT (flujo) DO NOTHING;
