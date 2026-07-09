# M@umora Stream Proxy para Render

Proxy HTTPS para reproducir streams HTTP en la web de M@umora Cine.

## Configuracion en Render

1. Crea un nuevo **Web Service**.
2. Conecta este repositorio.
3. En **Root Directory** usa:
   `render-stream-proxy`
4. En **Runtime** usa Node.
5. En **Build Command** deja:
   `npm install`
6. En **Start Command** deja:
   `npm start`
7. En variables de entorno agrega:
   `ALLOWED_ORIGINS=https://maumoracine.web.app,https://maumoracine.firebaseapp.com`

Cuando Render te entregue la URL, debe quedar parecida a:

`https://maumora-stream-proxy.onrender.com/stream`

Esa URL se pone en la app como:

`VITE_WEB_STREAM_PROXY_URL=https://maumora-stream-proxy.onrender.com/stream`
