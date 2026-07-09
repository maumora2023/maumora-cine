# M@umora UltraTV Proxy

Proxy de Cloudflare Workers para guardar la URL M3U privada como secreto de servidor.

## Configuracion

```powershell
cd workers/ultratv-proxy
npm create cloudflare@latest
npx wrangler login
npx wrangler secret put ULTRATV_M3U_URL
npx wrangler deploy
```

Cuando `wrangler secret put ULTRATV_M3U_URL` pregunte el valor, pega la URL completa de la lista M3U.

Despues del deploy, copia la URL del Worker en `.env`:

```env
VITE_PRIVATE_TV_PROXY_URL=https://maumora-ultratv-proxy.TU-CUENTA.workers.dev
```

Luego ejecuta build y deploy de la app.

## Nota

Esto oculta la URL original dentro del servidor. Para evitar que terceros usen el proxy publico, el siguiente paso recomendado es agregar verificacion de Firebase Auth o App Check.
