# Despliegue y prueba

## Sitio institucional actual

El repositorio privado del sitio es `CuevaBenjamin-dev/boston-web`. La rama de publicación es `main`. No hay un despliegue automático de GitHub configurado para el Worker. Publica manualmente desde la raíz del proyecto con Wrangler autenticado en la cuenta de Boston:

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm exec wrangler deploy
```

El destino es el Worker existente `boston-web` con Static Assets en `./dist`, asociado a `https://bostonbbs.com`. Antes de compilar, configura `PUBLIC_API_URL` y `PUBLIC_TURNSTILE_SITE_KEY` con los valores vigentes de producción mediante un archivo `.env.production` ignorado por Git. No copies secretos al repositorio. Comprueba luego el sitio, los formularios, `https://bostonbbs.com/robots.txt` y `https://bostonbbs.com/sitemap-index.xml`. La verificación de propiedad y el envío del sitemap a Google Search Console son pasos manuales del propietario.

Los recursos actuales están en [configuracion-cloudflare.md](configuracion-cloudflare.md). El siguiente procedimiento histórico abarca también API y CRM; no forma parte del despliegue habitual del sitio web:

```powershell
cd api-worker
npm ci
npm test
npm run build
npx wrangler d1 migrations list boston-web-db --remote
npx wrangler d1 migrations apply boston-web-db --remote
npm run deploy
cd ..
npm ci
npm run build
npx wrangler deploy
cd crm
npm ci
npm test
npm run build
npx wrangler deploy
```

Antes del build Astro, define `PUBLIC_API_URL` y `PUBLIC_TURNSTILE_SITE_KEY` según [configuración](configuracion-cloudflare.md), por ejemplo en `.env.production` ignorado por Git. Los despliegues usan Workers Static Assets. La política Access y el secret Turnstile se configuran en Cloudflare.

## Flujo de prueba

1. Abre [admisiones](https://boston-web.cueva-dev.workers.dev/es/admisiones/), completa una postulación ficticia y Turnstile. Comprueba confirmación y HTTP 201 en `POST /api/postulaciones`.
2. Abre el [CRM](https://boston-crm.cueva-dev.workers.dev), autentícate con el email permitido y el OTP recibido. Encuentra la postulación, cambia `nuevo` a `contactado`, añade una nota y recarga; estado, nota e historial deben persistir.
3. Envía una consulta ficticia desde `/es/contacto/`, comprueba 201 y su aparición en Contactos. Cambia el estado y recarga.
4. Repite un envío en `/en/admisiones/` o `/en/contacto/`; comprueba también las rutas canónicas, home, blog y enlaces principales.
5. Verifica rechazo de token ausente/inválido, email y grado inválidos, origen CORS ajeno y acceso CRM sin sesión/JWT.

Para inspeccionar D1 sin imprimir datos personales en logs compartidos, ejecuta desde `api-worker` `npx wrangler d1 execute boston-web-db --remote --command "SELECT COUNT(*) AS total FROM postulaciones"` y análogamente para `contactos_web`. Para un registro concreto, usa la consola privada Cloudflare.

Si falla el formulario, revisa las variables públicas del build, el hostname del widget, el secret, CORS y la migración. Si CRM deniega acceso tras Access, comprueba AUD y email/rol/activo en `usuarios_crm`. Usa logs privados sin publicar datos personales ni secretos.
