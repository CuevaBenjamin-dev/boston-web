# Arquitectura

```text
Visitante → boston-web (Astro/Static Assets) → Turnstile → boston-api → D1
Valana Repartidor (futuro) → acceso privado por definir → D1
```

La web envía JSON a `POST /api/postulaciones` y `POST /api/contactos`. La API valida origen, tipo, tamaño, campos y token Turnstile mediante Siteverify; comprueba `action` y `hostname` antes de escribir con sentencias preparadas en D1. CORS restringe navegadores; Turnstile y la validación del servidor controlan el formulario. El secreto Turnstile existe solo en el Worker. `boston-api` ya no envía avisos al antiguo `boston-crm`.

El antiguo CRM es un proyecto separado y no recibe eventos de `boston-api`. Su acceso, si permanece operativo, se gestiona independientemente con Cloudflare Access; esta entrega no modifica su Worker, sus rutas ni sus datos.

La migración versionada `api-worker/migrations/0001_inicial.sql` crea `usuarios_crm`, `postulaciones`, `contactos_web`, `notas_postulacion` e `historial_postulacion`, con claves foráneas, restricciones e índices. El cambio de estado y su entrada de historial se ejecutan en un batch D1. La implementación anterior de Supabase está aislada en `legacy-supabase/` y no se despliega.
