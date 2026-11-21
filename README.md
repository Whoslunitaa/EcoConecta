# EcoConecta - Villas de San Pablo (MVP Accesible Audio-First)

Plataforma digital comunitaria para conectar hogares, unidades productivas, huerteros y recicladores en la gestión de residuos orgánicos y reciclables en Villas de San Pablo, Barranquilla.

## Arquitectura del Sistema

```text
+-------------------------------------------------------------------+
|  FRONTEND (Next.js 14 + React + TypeScript + Tailwind CSS)        |
|  - Lectura en voz alta en cada elemento (Web Speech API / MP3)    |
|  - Modo "Escuchar Primero" (1er toque lee, 2do toque confirma)    |
|  - Dictado por voz (SpeechRecognition) y geolocalización GPS      |
+---------------------------------+---------------------------------+
                                  | HTTP REST / JSON
                                  v
+-------------------------------------------------------------------+
|  BACKEND (Python 3.11 + FastAPI + Psycopg)                        |
|  - Enrutamiento automático por flujo (RN-01)                      |
|  - Control de privacidad por rol (RN-07) y usuarios piloto (RN-08)|
|  - Trazabilidad de estados (RN-02, RN-03, RN-04)                  |
|  - Asignación parametrizable de puntos al cerrar (RN-05, RN-06)   |
+----------------+---------------------------------+----------------+
                 |                                 |
                 v                                 v
+---------------------------------+  +------------------------------+
|  BASE DE DATOS (PostgreSQL 16)  |  |  INTEGRACIONES AUTORIZADAS   |
|  - usuarios                     |  |  - WhatsApp Business Cloud   |
|  - solicitudes                  |  |    API (notificaciones)      |
|  - historial_estados            |  |  - OpenAI TTS (pregeneración |
|  - reglas_puntos                |  |    offline de audios fijos)  |
|  - contenidos_educativos        |  |                              |
+---------------------------------+  +------------------------------+