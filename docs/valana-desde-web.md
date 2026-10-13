# Formularios de Boston en Valana

`boston-api` conserva el envío original en D1. Desde la migración `0003_entregas_valana.sql`, cada formulario **nuevo** crea una entrega pendiente; los registros anteriores no se importan ni se borran. Tras guardar, el Worker intenta enviarlo a la API privada de Valana. Un Cron Trigger cada cinco minutos revisa hasta veinte entregas pendientes y solo llama a Valana cuando las hay. Los fallos se reintentan con espera creciente hasta una hora; el formulario original y su entrega pendiente permanecen en D1.

La llamada entre servidores usa `VALANA_INTEGRATION_TOKEN` (secret del Worker) y `BOSTON_WEB_TOKEN` (archivo privado de Valana), con el mismo valor. La URL pública del backend se configura como `VALANA_API_URL`. Nunca se envían el token de Turnstile ni el secreto al navegador. Valana deduplica mediante `(tipo, id de D1)`, guarda la solicitud web separada del chat de WhatsApp y utiliza el contador diario compartido para repartirla. No envía respuestas automáticas de WhatsApp por los formularios. D1 mantiene el envío original; el estado de atención y las notas se gestionan en Valana.

## Orden de activación

1. Guardar en privado la misma clave aleatoria (32 bytes como mínimo) en el VPS y en el Worker. No añadirla a Git.
2. Respaldar y validar PostgreSQL, aplicar la migración `014_solicitudes_web.sql` y actualizar la API de Valana.
3. Aplicar a D1 `0003_entregas_valana.sql`. Desde este instante quedan en cola solo los nuevos envíos.
4. Desplegar `boston-api`; comprobar la cola por recuento, sin imprimir datos personales.
5. Publicar los frontends de Boston y Valana. Valana utiliza su SSE existente y limita cada asesor a sus solicitudes asignadas.

Las migraciones no importan formularios anteriores y no modifican las tablas originales de admisión/contacto. Una solicitud pendiente por falta de asesores se asigna cuando vuelve a haber uno elegible, según el horario y el contador compartido.
