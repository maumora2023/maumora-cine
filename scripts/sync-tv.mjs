import { readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tvSources } from './tv-sources.mjs';

const outDir = new URL('../public/data/', import.meta.url);
const ofutbolMirrorDir = process.env.OFUTBOL_MIRROR_DIR || 'C:/Users/Maumora/Desktop/2/ofutbol.jdoxx.com';
const ofutbolBaseUrl = 'https://ofutbol.jdoxx.com';
loadEnv();
const ofutbolApiToken = process.env.OFUTBOL_API_TOKEN || '';
const ofutbolApiOrigin = process.env.OFUTBOL_API_ORIGIN || 'https://maumoracine.web.app';

function loadEnv() {
  try {
    const text = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) {
        process.env[key] = rest.join('=').replace(/^["']|["']$/g, '');
      }
    });
  } catch {
    // Optional local config.
  }
}

function parseM3u(text, sourceName) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const channels = [];
  let current = null;

  lines.forEach((line) => {
    if (line.startsWith('#EXTINF')) {
      current = {
        name: line.split(',').pop()?.trim() || 'Canal',
        group: getM3uAttribute(line, 'group-title') || sourceName,
        logo: getM3uAttribute(line, 'tvg-logo'),
      };
      return;
    }

    if (!line.startsWith('#') && current) {
      channels.push({ ...current, url: line });
      current = null;
    }
  });

  return channels.filter((channel) => /^https?:\/\//i.test(channel.url));
}

function getM3uAttribute(line, name) {
  const match = line.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match?.[1]?.trim() || '';
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 M@umora Cine IPTV Sync',
      accept: 'application/x-mpegurl,text/plain,*/*',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 M@umora Cine Sync',
      accept: 'text/html,application/xhtml+xml,*/*',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteOfutbolUrl(path) {
  if (!path) return ofutbolBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${ofutbolBaseUrl}/app/${path.replace(/^(\.\.\/)+/, '').replace(/^app\//, '')}`.replace(/\.html$/, '');
}

function pickAttr(html, name) {
  const match = html.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return decodeHtml(match?.[1] || '');
}

function parseOfutbolCards(html, itemType) {
  const cards = [...html.matchAll(/<a\s+href="([^"]+)"\s+class="item"[\s\S]*?<\/a>/gi)];
  return cards
    .map((match) => {
      const href = decodeHtml(match[1]);
      const block = match[0];
      const titleMatch = block.match(/<span class="(?:name|titulo)">([\s\S]*?)<\/span>/i);
      const imageMatch = block.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i);
      const yearMatch = block.match(/<span class="ano">([\s\S]*?)<\/span>/i);
      const durationMatch = block.match(/<span class="duracion">[\s\S]*?<\/i>\s*([\s\S]*?)<\/span>/i);
      const category = href.includes('/deportes/') || href.includes('/espn/') || href.includes('/fox-sport/')
        ? 'Deportes'
        : href.includes('/colombia/')
          ? 'Colombia'
          : href.includes('/dazn/')
            ? 'DAZN'
            : itemType;

      return {
        name: decodeHtml(titleMatch?.[1] || href.split('/').pop()?.replace(/-/g, ' ') || 'OnlineFutbol'),
        group: `OnlineFutbol ${category}`,
        logo: absoluteOfutbolAsset(imageMatch?.[1] || ''),
        url: absoluteOfutbolUrl(href),
        externalPage: true,
        sourceType: itemType,
        year: decodeHtml(yearMatch?.[1] || ''),
        duration: decodeHtml(durationMatch?.[1] || ''),
      };
    })
    .filter((item) => item.name && item.url);
}

function absoluteOfutbolAsset(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${ofutbolBaseUrl}/${path.replace(/^(\.\.\/)+/, '')}`;
}

function flattenScheduleItems(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return [];

  const directKeys = ['data', 'events', 'eventos', 'schedule', 'shedule', 'items', 'matches', 'partidos'];
  for (const key of directKeys) {
    const items = flattenScheduleItems(value[key]);
    if (items.length) return items;
  }

  return Object.values(value).flatMap((entry) => {
    if (Array.isArray(entry)) return entry;
    if (entry && typeof entry === 'object') return flattenScheduleItems(entry);
    return [];
  });
}

function normalizeOfutbolScheduleItem(item, index) {
  if (!item || typeof item !== 'object') return null;

  const rawName = item.title || item.name || item.event || item.evento || item.partido || item.match || item.titulo;
  const name = decodeHtml(String(rawName || `Evento ${index + 1}`));
  const rawUrl = item.url || item.link || item.page || item.embed || item.video || item.stream || '';
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : ofutbolBaseUrl;
  const logo = item.logo || item.image || item.img || item.poster || item.icon || '';
  const category = item.category || item.categoria || item.league || item.competition || item.sport || 'Agenda';
  const time = item.time || item.hour || item.hora || item.fecha || item.date || '';

  return {
    name,
    group: `OnlineFutbol ${decodeHtml(String(category))}`,
    logo: absoluteOfutbolAsset(String(logo || '')),
    url,
    externalPage: true,
    sourceType: 'Evento',
    time: decodeHtml(String(time || '')),
  };
}

function parseOfutbolSchedule(data) {
  return flattenScheduleItems(data)
    .map(normalizeOfutbolScheduleItem)
    .filter((item) => item?.name);
}

async function loadOfutbolApiSource() {
  if (!ofutbolApiToken) return null;

  try {
    const response = await fetch(`${ofutbolBaseUrl}/api/shedule/${ofutbolApiToken}`, {
      headers: {
        accept: 'application/json',
        origin: ofutbolApiOrigin,
        referer: `${ofutbolApiOrigin.replace(/\/$/, '')}/`,
        'user-agent': 'Mozilla/5.0 M@umora Cine IPTV Sync',
      },
    });
    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('La API no devolvio JSON valido');
    }

    if (!response.ok) {
      throw new Error(data?.text || data?.message || `${response.status} ${response.statusText}`);
    }

    if (data?.code && Number(data.code) !== 1 && Number(data.code) !== 200) {
      throw new Error(data.text || data.message || `Codigo ${data.code}`);
    }

    const channels = parseOfutbolSchedule(data);
    if (!channels.length) throw new Error('La API no devolvio eventos visibles');

    return {
      group: 'OnlineFutbol',
      name: 'OnlineFutbol agenda API',
      url: `${ofutbolBaseUrl}/api/shedule`,
      channels,
      note: 'Agenda sincronizada desde la API de OnlineFutbol. La clave se lee desde .env y no se publica.',
    };
  } catch (error) {
    console.warn(`OnlineFutbol agenda API: no se pudo sincronizar (${error.message})`);
    return null;
  }
}

async function readIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

async function fetchOfutbolPage(path, fallbackFile) {
  try {
    return await fetchHtml(`${ofutbolBaseUrl}/app/${path}`);
  } catch (error) {
    const fallback = await readIfExists(`${ofutbolMirrorDir}/app/${fallbackFile}`);
    if (fallback) {
      console.warn(`OnlineFutbol ${path}: no se pudo leer en vivo (${error.message}); se usa respaldo local`);
    }
    return fallback;
  }
}

async function listOfutbolEventPages() {
  const eventDir = `${ofutbolMirrorDir}/app/eventos`;
  try {
    const items = await readdir(eventDir);
    const htmlFiles = items.filter((item) => item.endsWith('.html'));
    const eventPages = await Promise.all(htmlFiles.map(async (file) => {
      const filePath = `${eventDir}/${file}`;
      const html = await readIfExists(filePath);
      const title = decodeHtml(
        pickAttr(html, 'twitter:title')
        || html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
        || file.replace(/\.html$/, '').replace(/-/g, ' '),
      ).replace(/\s+-\s+Online futbol$/i, '');
      const image = absoluteOfutbolAsset(
        pickAttr(html, 'twitter:image')
        || pickAttr(html, 'og:image')
        || '../../files/evento.webp',
      );

      return {
        name: title,
        group: 'OnlineFutbol Eventos',
        logo: image,
        url: `${ofutbolBaseUrl}/app/eventos/${file.replace(/\.html$/, '')}`,
        externalPage: true,
        sourceType: 'Evento',
      };
    }));
    return eventPages.filter((item) => item.name);
  } catch {
    return [];
  }
}

async function loadOfutbolSource() {
  try {
    await stat(ofutbolMirrorDir);
  } catch {
    return null;
  }

  const [televisionHtml, events] = await Promise.all([
    fetchOfutbolPage('television', 'television.html'),
    listOfutbolEventPages(),
  ]);

  const channels = [
    ...parseOfutbolCards(televisionHtml, 'TV'),
    ...events,
  ];

  const uniqueChannels = Array.from(
    new Map(channels.map((channel) => [`${channel.name}-${channel.url}`, channel])).values(),
  );

  if (!uniqueChannels.length) return null;

  return {
    group: 'OnlineFutbol',
    name: 'OnlineFutbol enlaces visibles',
    url: ofutbolBaseUrl,
    channels: uniqueChannels,
    note: 'Fuente externa agregada desde HTML visible. No incluye enlaces ocultos ni scripts de reproduccion.',
  };
}

await mkdir(outDir, { recursive: true });

const sources = [];
let previousSources = [];

try {
  const previousData = JSON.parse(await readFile(new URL('tv.json', outDir), 'utf8'));
  previousSources = Array.isArray(previousData?.sources) ? previousData.sources : [];
} catch {
  previousSources = [];
}

const previousByName = new Map(previousSources.map((source) => [source.name, source]));

for (const source of tvSources) {
  try {
    const text = await fetchText(source.url);
    const channels = parseM3u(text, source.name);
    sources.push({ ...source, channels });
    console.log(`${source.name}: ${channels.length} canales`);
  } catch (error) {
    const previous = previousByName.get(source.name);
    const previousChannels = Array.isArray(previous?.channels) ? previous.channels : [];
    sources.push({ ...source, channels: previousChannels, error: error.message });
    console.warn(`${source.name}: no se pudo sincronizar (${error.message}); se conservan ${previousChannels.length} canales previos`);
  }
}

const ofutbolSource = await loadOfutbolSource();
if (ofutbolSource) {
  sources.unshift(ofutbolSource);
  console.log(`${ofutbolSource.name}: ${ofutbolSource.channels.length} enlaces visibles`);
}

const ofutbolApiSource = await loadOfutbolApiSource();
if (ofutbolApiSource) {
  sources.unshift(ofutbolApiSource);
  console.log(`${ofutbolApiSource.name}: ${ofutbolApiSource.channels.length} eventos`);
}

await writeFile(
  new URL('tv.json', outDir),
  JSON.stringify({ updatedAt: new Date().toISOString(), sources }, null, 2),
  'utf8',
);

const total = sources.reduce((sum, source) => sum + source.channels.length, 0);
console.log(`TV sincronizada: ${total} canales en ${sources.length} listas.`);
