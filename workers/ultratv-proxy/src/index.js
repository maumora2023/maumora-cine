const M3U_CONTENT_TYPE = 'application/vnd.apple.mpegurl; charset=utf-8';
const STREAM_PATH = '/stream';
const ASSET_PATH = '/asset';
const MAX_PLAYLIST_ENTRIES = 2400;
const MAX_TV_ENTRIES = 900;
const IPTV_USER_AGENT = 'VLC/3.0.20 LibVLC/3.0.20';

function corsHeaders(origin, allowedOrigin) {
  const allowedOrigins = getAllowedOrigins(allowedOrigin);
  const isAllowedOrigin = origin && allowedOrigins.some((allowed) => {
    if (allowed === origin) return true;
    if (allowed === 'http://localhost' && /^http:\/\/localhost:\d+$/i.test(origin)) return true;
    if (allowed === 'http://127.0.0.1' && /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)) return true;
    return false;
  });

  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
    'Access-Control-Max-Age': '3600',
    Vary: 'Origin',
  };

  if (isAllowedOrigin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function getAllowedOrigins(value) {
  return String(value || 'https://maumoracine.web.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .concat([
      'http://localhost',
      'http://127.0.0.1',
      'capacitor://localhost',
      'https://localhost',
    ]);
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN || 'https://maumoracine.web.app');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'GET') {
      return Response.json({ error: 'Metodo no permitido' }, { status: 405, headers });
    }

    if (requestUrl.pathname === STREAM_PATH) {
      return proxyStream(request, requestUrl, headers);
    }

    if (requestUrl.pathname === ASSET_PATH) {
      return proxyAsset(requestUrl, headers);
    }

    if (!env.ULTRATV_M3U_URL) {
      return Response.json({ error: 'Lista privada no configurada' }, { status: 500, headers });
    }

    const upstream = await fetch(env.ULTRATV_M3U_URL, {
      headers: {
        Accept: 'application/x-mpegurl,text/plain,*/*',
        'User-Agent': IPTV_USER_AGENT,
        'Icy-MetaData': '1',
      },
      cf: {
        cacheTtl: 120,
        cacheEverything: false,
      },
    });

    if (!upstream.ok) {
      return Response.json(
        { error: 'No se pudo cargar la lista privada' },
        { status: upstream.status, headers },
      );
    }

    const body = await upstream.text();
    const rewrittenBody = rewritePlaylistUrls(body, requestUrl.origin, {
      mode: requestUrl.searchParams.get('mode') || 'catalog',
      delivery: requestUrl.searchParams.get('delivery') || 'proxy',
    });
    return new Response(rewrittenBody, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': M3U_CONTENT_TYPE,
        'Cache-Control': 'private, max-age=60',
      },
    });
  },
};

function rewritePlaylistUrls(body, origin, options = {}) {
  const mode = options.mode || 'catalog';
  const delivery = options.delivery || 'proxy';
  const output = ['#EXTM3U'];
  const maxEntries = mode === 'tv' ? MAX_TV_ENTRIES : MAX_PLAYLIST_ENTRIES;
  let entryCount = 0;
  let currentInfo = null;

  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF')) {
      currentInfo = line;
      continue;
    }

    if (/^https?:\/\//i.test(trimmed) && currentInfo) {
      if (shouldIncludePlaylistEntry(currentInfo, trimmed, mode)) {
        output.push(rewriteM3uAttributes(currentInfo, origin));
        output.push(delivery === 'direct' ? buildDirectPlaybackUrl(trimmed, currentInfo) : buildProxyUrl(origin, trimmed));
        entryCount += 1;
        if (entryCount >= maxEntries) break;
      }
      currentInfo = null;
    }
  }

  return output.join('\n');
}

function shouldIncludePlaylistEntry(infoLine, mediaUrl, mode) {
  if (mode === 'tv') return !isVodEntry(infoLine, mediaUrl);
  return true;
}

function isVodEntry(infoLine, mediaUrl) {
  const text = normalizeForMatch(`${infoLine} ${mediaUrl}`);
  const vodTokens = [
    'vod',
    'pelicula',
    'peliculas',
    'movie',
    'movies',
    'serie',
    'series',
    'estreno',
    'estrenos',
    'cine',
    'cinema',
  ];

  return vodTokens.some((token) => text.includes(token))
    || /\/(movie|series|vod)\//i.test(mediaUrl);
}

function normalizeForMatch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function proxyStream(request, requestUrl, headers) {
  const encoded = requestUrl.searchParams.get('u') || '';
  const upstreamUrl = fromBase64Url(encoded);

  if (!/^https?:\/\//i.test(upstreamUrl)) {
    return Response.json({ error: 'URL invalida' }, { status: 400, headers });
  }

  const range = request.headers.get('Range');
  const upstream = await fetchWithFallbacks(upstreamUrl, {
    headers: {
      Accept: '*/*',
      'User-Agent': IPTV_USER_AGENT,
      'Icy-MetaData': '1',
      Referer: new URL(upstreamUrl).origin,
      Origin: new URL(upstreamUrl).origin,
      ...(range ? { Range: range } : {}),
    },
    cf: {
      cacheTtl: isPlaylistUrl(upstreamUrl) ? 15 : 300,
      cacheEverything: false,
    },
  });

  const contentType = upstream.headers.get('content-type') || guessContentType(upstreamUrl);
  const responseHeaders = {
    ...headers,
    'Content-Type': contentType,
    'Cache-Control': isPlaylistUrl(upstreamUrl) ? 'no-store' : 'public, max-age=300',
  };
  copyHeader(upstream.headers, responseHeaders, 'Content-Length');
  copyHeader(upstream.headers, responseHeaders, 'Content-Range');
  copyHeader(upstream.headers, responseHeaders, 'Accept-Ranges');

  if (!upstream.ok) {
    return Response.json(
      { error: 'No se pudo abrir el stream' },
      { status: upstream.status, headers: responseHeaders },
    );
  }

  if (isPlaylistUrl(upstreamUrl) || contentType.includes('mpegurl')) {
    const text = await upstream.text();
    const baseUrl = new URL(upstreamUrl);
    const rewritten = text
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#')) return rewriteHlsUriAttributes(line, requestUrl.origin, baseUrl);
        const absoluteUrl = new URL(trimmed, baseUrl).toString();
        return buildProxyUrl(requestUrl.origin, absoluteUrl);
      })
      .join('\n');

    return new Response(rewritten, { status: 200, headers: responseHeaders });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

async function proxyAsset(requestUrl, headers) {
  const encoded = requestUrl.searchParams.get('u') || '';
  const upstreamUrl = fromBase64Url(encoded);

  if (!/^https?:\/\//i.test(upstreamUrl)) {
    return Response.json({ error: 'URL invalida' }, { status: 400, headers });
  }

  const upstream = await fetch(upstreamUrl, {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'User-Agent': 'M@umora Cine Asset Proxy',
      Referer: new URL(upstreamUrl).origin,
    },
    cf: {
      cacheTtl: 86400,
      cacheEverything: false,
    },
  });

  const responseHeaders = {
    ...headers,
    'Content-Type': upstream.headers.get('content-type') || guessImageContentType(upstreamUrl),
    'Cache-Control': 'public, max-age=86400',
  };
  copyHeader(upstream.headers, responseHeaders, 'Content-Length');

  if (!upstream.ok) {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

async function fetchWithFallbacks(upstreamUrl, options) {
  const attempts = buildXtreamFallbackUrls(upstreamUrl);
  let lastResponse = null;

  for (const url of attempts) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    lastResponse = response;
    if (![401, 403, 404].includes(response.status)) return response;
  }

  return lastResponse;
}

function buildXtreamFallbackUrls(value) {
  const urls = [];
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 4 && parts[0] === 'live') {
      const [prefix, user, pass, idWithExt] = parts;
      const id = idWithExt.replace(/\.[^.]+$/, '');
      urls.push(`${url.origin}/${prefix}/${user}/${pass}/${id}.m3u8`);
      urls.push(value);
    }
    if (parts.length === 3 && !['live', 'movie', 'series'].includes(parts[0])) {
      const [user, pass, id] = parts;
      urls.push(`${url.origin}/live/${user}/${pass}/${id}.m3u8`);
      urls.push(`${url.origin}/live/${user}/${pass}/${id}.ts`);
      urls.push(`${url.origin}/movie/${user}/${pass}/${id}.mp4`);
      urls.push(`${url.origin}/series/${user}/${pass}/${id}.mp4`);
    }
  } catch {
    // Si no es URL valida se usa el intento original.
  }
  urls.push(value);
  return Array.from(new Set(urls));
}

function buildProxyUrl(origin, targetUrl) {
  const proxy = new URL(`${origin}${STREAM_PATH}`);
  proxy.searchParams.set('u', toBase64Url(targetUrl));
  if (isPlaylistUrl(targetUrl) || isLikelyLiveStreamUrl(targetUrl)) proxy.searchParams.set('kind', 'hls');
  return proxy.toString();
}

function buildDirectPlaybackUrl(targetUrl, infoLine = '') {
  try {
    const url = new URL(targetUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 3 && !['live', 'movie', 'series'].includes(parts[0])) {
      const [user, pass, id] = parts;
      const entryType = getXtreamEntryType(infoLine, targetUrl);
      if (entryType === 'series') return `${url.origin}/series/${user}/${pass}/${id}.mp4`;
      if (entryType === 'movie') return `${url.origin}/movie/${user}/${pass}/${id}.mp4`;
      return `${url.origin}/live/${user}/${pass}/${id}.m3u8`;
    }
    if (parts.length === 4 && parts[0] === 'live') {
      const [prefix, user, pass, idWithExt] = parts;
      const id = idWithExt.replace(/\.[^.]+$/, '');
      return `${url.origin}/${prefix}/${user}/${pass}/${id}.m3u8`;
    }
  } catch {
    // Si no se puede normalizar, se usa la URL original.
  }
  return targetUrl;
}

function getXtreamEntryType(infoLine, mediaUrl) {
  const text = normalizeForMatch(`${infoLine} ${mediaUrl}`);
  if (text.includes('/series/') || text.includes('serie') || text.includes('series') || /\bs\d{1,2}e\d{1,3}\b/.test(text) || /\b\d{1,2}x\d{1,3}\b/.test(text)) {
    return 'series';
  }
  if (text.includes('/movie/') || text.includes('vod') || text.includes('pelicula') || text.includes('peliculas') || text.includes('movie') || text.includes('movies') || text.includes('cine') || text.includes('estreno')) {
    return 'movie';
  }
  return 'live';
}

function buildAssetProxyUrl(origin, targetUrl) {
  const proxy = new URL(`${origin}${ASSET_PATH}`);
  proxy.searchParams.set('u', toBase64Url(targetUrl));
  return proxy.toString();
}

function rewriteM3uAttributes(line, origin) {
  return line.replace(/\btvg-logo=(["'])(https?:\/\/[^"']+)\1/gi, (_match, quote, url) => {
    return `tvg-logo=${quote}${buildAssetProxyUrl(origin, url)}${quote}`;
  });
}

function rewriteHlsUriAttributes(line, origin, baseUrl) {
  return line.replace(/\bURI=(["'])([^"']+)\1/gi, (_match, quote, value) => {
    const absoluteUrl = new URL(value, baseUrl).toString();
    const proxiedUrl = isLikelyImageUrl(absoluteUrl)
      ? buildAssetProxyUrl(origin, absoluteUrl)
      : buildProxyUrl(origin, absoluteUrl);
    return `URI=${quote}${proxiedUrl}${quote}`;
  });
}

function isPlaylistUrl(value) {
  return /\.m3u8?(\?|#|$)/i.test(value);
}

function isLikelyLiveStreamUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    return /\/live\/[^/]+\/[^/]+\/[^/]+\.ts$/i.test(url.pathname)
      || (parts.length === 3 && !['live', 'movie', 'series'].includes(parts[0]));
  } catch {
    return false;
  }
}

function guessContentType(value) {
  if (/\.m3u8?(\?|#|$)/i.test(value)) return M3U_CONTENT_TYPE;
  if (/\.mp4(\?|#|$)/i.test(value)) return 'video/mp4';
  if (/\.ts(\?|#|$)/i.test(value)) return 'video/mp2t';
  return 'application/octet-stream';
}

function guessImageContentType(value) {
  if (/\.png(\?|#|$)/i.test(value)) return 'image/png';
  if (/\.jpe?g(\?|#|$)/i.test(value)) return 'image/jpeg';
  if (/\.webp(\?|#|$)/i.test(value)) return 'image/webp';
  if (/\.svg(\?|#|$)/i.test(value)) return 'image/svg+xml';
  return 'image/*';
}

function isLikelyImageUrl(value) {
  return /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(value);
}

function copyHeader(source, target, name) {
  const value = source.get(name);
  if (value) target[name] = value;
}

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}
