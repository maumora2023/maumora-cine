import { createServer } from 'node:http';
import { Readable } from 'node:stream';

const PORT = Number(process.env.PORT || 3000);
const STREAM_USER_AGENT = process.env.STREAM_USER_AGENT || 'VLC/3.0.20 LibVLC/3.0.20';
const ALLOWED_ORIGINS = new Set(
  String(process.env.ALLOWED_ORIGINS || 'https://maumoracine.web.app,https://maumoracine.firebaseapp.com,http://127.0.0.1:5173,http://127.0.0.1:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const server = createServer(async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (requestUrl.pathname !== '/stream') {
    sendJson(res, 404, { error: 'Ruta no disponible' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Metodo no permitido' });
    return;
  }

  const upstreamUrl = fromBase64Url(requestUrl.searchParams.get('u') || '');
  if (!/^https?:\/\//i.test(upstreamUrl)) {
    sendJson(res, 400, { error: 'URL invalida' });
    return;
  }

  try {
    const upstream = await fetchWithFallbacks(upstreamUrl, {
      method: req.method,
      headers: {
        accept: '*/*',
        'user-agent': STREAM_USER_AGENT,
        'icy-metadata': '1',
        referer: new URL(upstreamUrl).origin,
        origin: new URL(upstreamUrl).origin,
        ...(req.headers.range ? { range: req.headers.range } : {}),
      },
    });

    const contentType = upstream.headers.get('content-type') || guessContentType(upstreamUrl);
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': isPlaylistUrl(upstreamUrl) || contentType.includes('mpegurl') ? 'no-store' : 'public, max-age=120',
    };
    copyHeader(upstream.headers, headers, 'content-length', 'Content-Length');
    copyHeader(upstream.headers, headers, 'content-range', 'Content-Range');
    copyHeader(upstream.headers, headers, 'accept-ranges', 'Accept-Ranges');

    if (!upstream.ok) {
      sendJson(res, upstream.status, { error: 'No se pudo abrir el stream' }, headers);
      return;
    }

    if (isPlaylistUrl(upstreamUrl) || contentType.includes('mpegurl')) {
      const text = await upstream.text();
      const baseUrl = new URL(upstreamUrl);
      const rewritten = text
        .split(/\r?\n/)
        .map((line) => rewritePlaylistLine(line, req, baseUrl))
        .join('\n');

      res.writeHead(200, headers);
      res.end(rewritten);
      return;
    }

    res.writeHead(upstream.status, headers);
    if (req.method === 'HEAD' || !upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    sendJson(res, 502, { error: 'No se pudo conectar al stream' });
  }
});

server.listen(PORT, () => {
  console.log(`M@umora stream proxy listening on ${PORT}`);
});

async function fetchWithFallbacks(upstreamUrl, options) {
  const attempts = buildFallbackUrls(upstreamUrl);
  let lastResponse = null;

  for (const url of attempts) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    lastResponse = response;
    if (![401, 403, 404].includes(response.status)) return response;
  }

  return lastResponse;
}

function buildFallbackUrls(value) {
  const urls = [];
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts.length === 3 && !['live', 'movie', 'series'].includes(parts[0])) {
      const [user, pass, id] = parts;
      urls.push(`${url.origin}/${user}/${pass}/${id}`);
      urls.push(`${url.origin}/live/${user}/${pass}/${id}.m3u8`);
      urls.push(`${url.origin}/live/${user}/${pass}/${id}.ts`);
    } else if (parts.length === 4 && parts[0] === 'live') {
      const [, user, pass, idWithExt] = parts;
      const id = idWithExt.replace(/\.[^.]+$/, '');
      urls.push(`${url.origin}/${user}/${pass}/${id}`);
      urls.push(`${url.origin}/live/${user}/${pass}/${id}.m3u8`);
      urls.push(`${url.origin}/live/${user}/${pass}/${id}.ts`);
    }
  } catch {
    // Se usa la URL original abajo.
  }

  urls.push(value);
  return Array.from(new Set(urls));
}

function rewritePlaylistLine(line, req, baseUrl) {
  const trimmed = line.trim();
  if (!trimmed) return line;

  if (trimmed.startsWith('#')) {
    return line.replace(/\bURI=(["'])([^"']+)\1/gi, (_match, quote, value) => {
      const absoluteUrl = new URL(value, baseUrl).toString();
      return `URI=${quote}${buildProxyUrl(req, absoluteUrl)}${quote}`;
    });
  }

  return buildProxyUrl(req, new URL(trimmed, baseUrl).toString());
}

function buildProxyUrl(req, targetUrl) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}/stream?u=${toBase64Url(targetUrl)}`;
}

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
  res.setHeader('Access-Control-Max-Age', '3600');
}

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function copyHeader(source, target, sourceName, targetName) {
  const value = source.get(sourceName);
  if (value) target[targetName] = value;
}

function isPlaylistUrl(value) {
  return /\.m3u8?(\?|#|$)/i.test(value);
}

function guessContentType(value) {
  if (/\.m3u8?(\?|#|$)/i.test(value)) return 'application/vnd.apple.mpegurl; charset=utf-8';
  if (/\.mp4(\?|#|$)/i.test(value)) return 'video/mp4';
  if (/\.ts(\?|#|$)/i.test(value)) return 'video/mp2t';
  return 'application/octet-stream';
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return '';
  }
}
