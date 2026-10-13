# Solicitudes de la web para una futura integración con Valana Repartidor

`boston-api` conserva las solicitudes de admisión en la tabla D1 `postulaciones` y los mensajes de contacto en `contactos_web`. Ambos registros tienen `id`, `origen = 'web'`, `fecha_creacion`, `fecha_actualizacion`, `estado` y `idioma`; las postulaciones incluyen grado, estudiante y apoderado. Los formularios actuales solo usan los endpoints POST y mantienen Cloudflare Turnstile.

Para el futuro módulo **Desde Web**, implementar un acceso privado y autenticado a estas tablas, con permisos mínimos, paginación por `id` o `fecha_creacion` y tratamiento de datos personales. Valana deberá consumir esa interfaz privada o una integración autorizada con D1; no debe usar credenciales D1 en el navegador ni convertir los endpoints POST públicos en endpoints de lectura. Esta entrega no incluye dicha interfaz ni sincronización.
