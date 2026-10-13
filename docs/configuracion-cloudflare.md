# Recursos Cloudflare de Boston

Cuenta `cc59789a6848596b17f242888f248698`, subdominio workers.dev `cueva-dev`:

| Recurso | Nombre/valor |
| --- | --- |
| D1 | `boston-web-db` (`50d20d93-7b59-4bd0-8d06-448fd5f61673`) |
| Workers | `boston-web`, `boston-api`, `boston-crm` |
| Turnstile | `Boston Formularios`; sitekey pública `0x4AAAAAAFP7Bqih-rAwUxPE` |
| Access | Aplicación `Boston CRM`; política `Boston CRM Administradores`; proveedor `Boston CRM One-time PIN` |

Los tres `wrangler.jsonc` contienen bindings y variables no secretas. `api-worker/wrangler.jsonc` enlaza `DB`, fija `ORIGENES_PERMITIDOS` y `TURNSTILE_HOSTNAMES`, y exige el secret `TURNSTILE_SECRET_KEY`. Para rotarlo: `cd api-worker; npx wrangler secret put TURNSTILE_SECRET_KEY` e introdúcelo de forma interactiva. Nunca pongas el secreto en Git, `PUBLIC_*`, `VITE_*` ni en argumentos de terminal. `crm/wrangler.jsonc` enlaza D1 y configura `TEAM_DOMAIN` y `POLICY_AUD` para verificar el JWT.

La web Astro necesita `PUBLIC_API_URL=https://boston-api.cueva-dev.workers.dev` y `PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAFP7Bqih-rAwUxPE` durante el build. El widget Turnstile y la API admiten `bostonbbs.com`, `www.bostonbbs.com` y el subdominio `workers.dev` existente. El antiguo CRM no recibe avisos de los formularios.

Si cambia el dominio público de la web, añade su hostname al widget Turnstile y a `ORIGENES_PERMITIDOS` y `TURNSTILE_HOSTNAMES` de `boston-api`, y reconstruye el sitio. Verifica las rutas y los formularios tras desplegar.
