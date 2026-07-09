import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

const UPSTREAM_BASE_URL = process.env.CATALOG_API_BASE_URL || 'https://enygmacinehd.fun';
const ALLOWED_ORIGINS = new Set([
  'https://maumoracine.web.app',
  'https://maumoracine.firebaseapp.com',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5173',
  'http://localhost:5174',
]);

const ROUTES = new Map([
  ['movies', '/api/content/movies'],
  ['series', '/api/content/series'],
  ['anime', '/api/content/anime'],
  ['home', '/api/content/home'],
]);

const STREAM_USER_AGENT = 'VLC/3.0.20 LibVLC/3.0.20';

function setCors(req, res) {
  const origin = req.get('origin') || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Accept, Content-Type, X-Firebase-AppCheck');
  res.set('Access-Control-Max-Age', '3600');
}

function getCatalogType(req) {
  const path = (req.path || '').replace(/^\/+/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'api' && parts[1] === 'catalog') return parts[2] || '';
  if (parts[0] === 'catalog') return parts[1] || '';
  return parts[0] || String(req.query.type || '').trim();
}

function buildUpstreamUrl(type, query) {
  const upstreamPath = ROUTES.get(type);
  if (!upstreamPath) return null;

  const url = new URL(upstreamPath, UPSTREAM_BASE_URL);
  const allowedQuery = ['limit', 'offset', 'page', 'profile'];

  allowedQuery.forEach((key) => {
    const value = query[key];
    if (typeof value === 'string' && value.trim()) {
      url.searchParams.set(key, value.trim());
    }
  });

  return url;
}

export const catalog = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metodo no permitido' });
      return;
    }

    const type = getCatalogType(req);
    const upstreamUrl = buildUpstreamUrl(type, req.query);

    if (!upstreamUrl) {
      res.status(404).json({ error: 'Catalogo no disponible' });
      return;
    }

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'M@umora Cine Catalog Proxy',
        },
      });

      const text = await upstreamResponse.text();
      res.set('Content-Type', upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=120, s-maxage=300');

      if (!upstreamResponse.ok) {
        logger.warn('Catalog upstream error', {
          status: upstreamResponse.status,
          type,
        });
        res.status(upstreamResponse.status).send(text);
        return;
      }

      res.status(200).send(text);
    } catch (error) {
      logger.error('Catalog proxy failed', { type, message: error.message });
      res.status(502).json({ error: 'No se pudo cargar el catalogo' });
    }
  },
);

export const stream = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (req, res) => {
    setCors(req, res);
    res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.status(405).json({ error: 'Metodo no permitido' });
      return;
    }

    const upstreamUrl = fromBase64Url(String(req.query.u || ''));
    if (!/^https?:\/\//i.test(upstreamUrl)) {
      res.status(400).json({ error: 'URL invalida' });
      return;
    }

    try {
      const upstream = await fetchWithStreamFallbacks(upstreamUrl, {
        method: req.method,
        headers: {
          accept: '*/*',
          'user-agent': STREAM_USER_AGENT,
          'icy-metadata': '1',
          referer: new URL(upstreamUrl).origin,
          origin: new URL(upstreamUrl).origin,
          ...(req.get('range') ? { range: req.get('range') } : {}),
        },
      });

      const contentType = upstream.headers.get('content-type') || guessContentType(upstreamUrl);
      res.set('Content-Type', contentType);
      res.set('Cache-Control', isPlaylistUrl(upstreamUrl) || contentType.includes('mpegurl') ? 'no-store' : 'public, max-age=120');
      copyResponseHeader(upstream.headers, res, 'content-length', 'Content-Length');
      copyResponseHeader(upstream.headers, res, 'content-range', 'Content-Range');
      copyResponseHeader(upstream.headers, res, 'accept-ranges', 'Accept-Ranges');

      if (!upstream.ok) {
        logger.warn('Stream upstream error', { status: upstream.status });
        res.status(upstream.status).json({ error: 'No se pudo abrir el stream' });
        return;
      }

      if (isPlaylistUrl(upstreamUrl) || contentType.includes('mpegurl')) {
        const text = await upstream.text();
        const baseUrl = new URL(upstreamUrl);
        const rewritten = text
          .split(/\r?\n/)
          .map((line) => rewritePlaylistLine(line, req, baseUrl))
          .join('\n');
        res.status(200).send(rewritten);
        return;
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.status(upstream.status).send(buffer);
    } catch (error) {
      logger.error('Stream proxy failed', { message: error.message });
      res.status(502).json({ error: 'No se pudo conectar al stream' });
    }
  },
);

async function fetchWithStreamFallbacks(upstreamUrl, options) {
  const attempts = buildStreamFallbackUrls(upstreamUrl);
  let lastResponse = null;

  for (const url of attempts) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    lastResponse = response;
    if (![401, 403, 404].includes(response.status)) return response;
  }

  return lastResponse;
}

function buildStreamFallbackUrls(value) {
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
  if (!trimmed || trimmed.startsWith('#')) {
    return line.replace(/\bURI=(["'])([^"']+)\1/gi, (_match, quote, value) => {
      const absoluteUrl = new URL(value, baseUrl).toString();
      return `URI=${quote}${buildFunctionStreamUrl(req, absoluteUrl)}${quote}`;
    });
  }

  const absoluteUrl = new URL(trimmed, baseUrl).toString();
  return buildFunctionStreamUrl(req, absoluteUrl);
}

function buildFunctionStreamUrl(req, targetUrl) {
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}/api/stream?u=${toBase64Url(targetUrl)}`;
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

function copyResponseHeader(source, res, sourceName, targetName) {
  const value = source.get(sourceName);
  if (value) res.set(targetName, value);
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
