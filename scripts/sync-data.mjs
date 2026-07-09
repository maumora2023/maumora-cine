import { mkdir, readFile, writeFile } from 'node:fs/promises';

const defaultBaseUrl = 'https://enygmacinehd.fun';
const dataDir = new URL('../public/data/', import.meta.url);
const pageSize = Number(process.env.CATALOG_PAGE_SIZE || 120);
const blockedPlaybackHosts = new Set(['ok.ru', 'www.ok.ru', 'm.ok.ru']);
const ofutbolBaseUrl = 'https://ofutbol.jdoxx.com';

await loadDotEnv();

const catalogBaseUrl = (process.env.STREAMFLIX_API_BASE_URL || process.env.CATALOG_API_BASE_URL || defaultBaseUrl).replace(/\/$/, '');
const isCustomCatalog = catalogBaseUrl !== defaultBaseUrl;
const authToken = process.env.STREAMFLIX_API_TOKEN || process.env.CATALOG_API_TOKEN || '';
const ofutbolMirrorDir = process.env.OFUTBOL_MIRROR_DIR || 'C:/Users/Maumora/Desktop/2/ofutbol.jdoxx.com';

const endpoints = {
  home: process.env.STREAMFLIX_HOME_ENDPOINT || process.env.CATALOG_HOME_ENDPOINT || '/api/content/home?profile=senor',
  movies: process.env.STREAMFLIX_MOVIES_ENDPOINT || process.env.CATALOG_MOVIES_ENDPOINT || '/api/content/movies',
  series: process.env.STREAMFLIX_SERIES_ENDPOINT || process.env.CATALOG_SERIES_ENDPOINT || '/api/content/series',
  anime: process.env.STREAMFLIX_ANIME_ENDPOINT || process.env.CATALOG_ANIME_ENDPOINT || '/api/content/anime',
};

async function loadDotEnv() {
  try {
    const envText = await readFile(new URL('../.env', import.meta.url), 'utf8');
    for (const line of envText.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // El archivo .env es opcional.
  }
}

function headers() {
  return {
    accept: 'application/json',
    ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
  };
}

async function fetchJson(pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${catalogBaseUrl}${pathOrUrl}`;
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    throw new Error(`No se pudo descargar ${url}: ${response.status}`);
  }

  return response.json();
}

function pick(item, keys, fallback = null) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function pickImage(item, keys) {
  const value = pick(item, keys);
  if (typeof value === 'string') return value;
  return pick(value || {}, ['url', 'src', 'path']);
}

function normalizeYear(value) {
  if (!value) return null;
  const match = String(value).match(/\d{4}/);
  return match ? match[0] : String(value);
}

function normalizeGenre(value) {
  if (Array.isArray(value)) return value.map((entry) => (typeof entry === 'string' ? entry : entry?.name)).filter(Boolean).join(', ');
  return value || '';
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFromId(value) {
  return String(value || 'Sin titulo')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isSpanishItem(item) {
  if (!isCustomCatalog) return true;

  const language = String(pick(item, ['idioma', 'language', 'audio', 'audioLanguage', 'lang'], '')).toLowerCase();
  const subtitle = String(pick(item, ['subtitulos', 'subtitles', 'subtitleLanguage', 'captionLanguage'], '')).toLowerCase();
  const title = String(pick(item, ['titulo', 'title', 'name'], '')).toLowerCase();

  if (language && /(es|spa|spanish|español|latino|castellano)/i.test(language)) return true;
  if (subtitle && /(es|spa|spanish|español|latino|castellano)/i.test(subtitle)) return true;
  if (/\b(latino|castellano|español|subtitulado|sub español|sub esp)\b/i.test(title)) return true;

  return !language && !subtitle;
}

function isAllowedPlaybackUrl(value) {
  if (!value) return false;

  try {
    const host = new URL(value).hostname.toLowerCase();
    return !blockedPlaybackHosts.has(host);
  } catch {
    return true;
  }
}

function absoluteOfutbolUrl(path) {
  if (!path) return ofutbolBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${ofutbolBaseUrl}/app/${path.replace(/^(\.\.\/)+/, '').replace(/^app\//, '')}`.replace(/\.html$/, '');
}

function resolveOfutbolUrl(path, basePath = `${ofutbolBaseUrl}/app/`) {
  if (!path) return '';
  try {
    return new URL(path, basePath).href;
  } catch {
    return absoluteOfutbolUrl(path);
  }
}

function absoluteOfutbolAsset(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${ofutbolBaseUrl}/${path.replace(/^(\.\.\/)+/, '')}`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,*/*',
      'user-agent': 'Mozilla/5.0 M@umora Cine Catalog Sync',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function readLocalText(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

async function loadOfutbolMoviesHtml() {
  try {
    return await fetchHtml(`${ofutbolBaseUrl}/app/peliculas`);
  } catch (error) {
    const fallback = await readLocalText(`${ofutbolMirrorDir}/app/peliculas.html`);
    if (fallback) {
      console.warn(`OnlineFutbol peliculas: no se pudo leer en vivo (${error.message}); se usa respaldo local`);
    }
    return fallback;
  }
}

async function loadOfutbolMovieDetailHtml(href) {
  const publicUrl = absoluteOfutbolUrl(href);
  const localPath = `${ofutbolMirrorDir}/app/${href}`;

  try {
    return await fetchHtml(publicUrl);
  } catch {
    return readLocalText(localPath);
  }
}

function extractMetaContent(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta[^>]+(?:name|property|itemprop)=["']${escapedName}["'][^>]+content=["']([^"']*)["']`, 'i'));
  return decodeHtml(match?.[1] || '');
}

function extractOfutbolPlayerUrl(html, href) {
  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']*server\/play\/[^"']*)["']/i);
  if (!iframeMatch) return '';
  return resolveOfutbolUrl(decodeHtml(iframeMatch[1]), `${ofutbolBaseUrl}/app/${href}`);
}

async function loadOfutbolMovies() {
  const html = await loadOfutbolMoviesHtml();
  if (!html) return [];

  const cards = [...html.matchAll(/<a\s+href="([^"]+)"\s+class="item"[\s\S]*?<\/a>/gi)];
  const movies = cards
    .map((match) => {
      const href = decodeHtml(match[1]);
      const block = match[0];
      const title = decodeHtml(block.match(/<span class="(?:name|titulo)">([\s\S]*?)<\/span>/i)?.[1] || '');
      const image = block.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i)?.[1] || '';
      const year = decodeHtml(block.match(/<span class="ano">([\s\S]*?)<\/span>/i)?.[1] || '');
      const genre = decodeHtml(block.match(/<span class="calidad">([\s\S]*?)<\/span>/i)?.[1] || 'OnlineFutbol');
      const id = `ofutbol-${href.replace(/\.html$/i, '').split('/').pop()?.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`;

      return {
        id,
        titulo: title || titleFromId(id),
        sourceHref: href,
        sinopsis: 'Pelicula agregada desde OnlineFutbol.',
        posterUrl: absoluteOfutbolAsset(image),
        backdropUrl: absoluteOfutbolAsset(image),
        logoUrl: '',
        urlReproduccion: absoluteOfutbolUrl(href),
        youtubeTrailer: '',
        genero: genre || 'OnlineFutbol',
        año: normalizeYear(year),
        actores: '',
        vistas: '0',
        esVip: false,
        tipo: 'pelicula',
        status: 'visible',
        valoracion: '',
        idioma: 'Español',
        subtitulos: '',
        categoria: 'movie',
        detailUrl: `/detail/movie/${id}`,
        watchUrl: `/watch/movie/${id}`,
        externalPage: true,
      };
    })
    .filter((movie) => movie.titulo && movie.urlReproduccion);

  const enriched = await mapLimit(movies, 4, async (movie) => {
    const detailHtml = await loadOfutbolMovieDetailHtml(movie.sourceHref);
    const sinopsis = extractMetaContent(detailHtml, 'description') || movie.sinopsis;
    const backdrop = extractMetaContent(detailHtml, 'twitter:image')
      || extractMetaContent(detailHtml, 'og:image')
      || movie.backdropUrl;

    const { sourceHref, ...cleanMovie } = movie;
    return {
      ...cleanMovie,
      sinopsis,
      backdropUrl: backdrop,
      posterUrl: cleanMovie.posterUrl || backdrop,
      urlReproduccion: cleanMovie.urlReproduccion,
      externalPage: true,
    };
  });

  return enriched;
}

function normalizeMovie(item) {
  const id = String(pick(item, ['id', '_id', 'tmdbId', 'movieId', 'slug', 'contentId'], crypto.randomUUID()));
  const urlReproduccion = pick(item, [
    'urlReproduccion',
    'streamUrl',
    'stream_url',
    'playbackUrl',
    'playback_url',
    'videoUrl',
    'video_url',
    'embedUrl',
    'embed_url',
    'url',
  ]);

  return {
    id,
    titulo: pick(item, ['titulo', 'title', 'name', 'nombre'], titleFromId(id)),
    sinopsis: pick(item, ['sinopsis', 'overview', 'description', 'plot', 'descripcion'], ''),
    posterUrl: pickImage(item, ['posterUrl', 'poster', 'poster_path', 'image', 'cover', 'thumbnail']),
    backdropUrl: pickImage(item, ['backdropUrl', 'backdrop', 'backdrop_path', 'background', 'fanart']),
    logoUrl: pickImage(item, ['logoUrl', 'logo']),
    urlReproduccion,
    youtubeTrailer: pick(item, ['youtubeTrailer', 'trailer', 'trailerUrl']),
    genero: normalizeGenre(pick(item, ['genero', 'genre', 'genres', 'category'])),
    año: normalizeYear(pick(item, ['año', 'year', 'releaseYear', 'release_date', 'releaseDate', 'date'])),
    actores: normalizeGenre(pick(item, ['actores', 'cast', 'actors'])),
    vistas: pick(item, ['vistas', 'views'], '0'),
    esVip: Boolean(pick(item, ['esVip', 'vip', 'premium'], false)),
    tipo: 'pelicula',
    status: pick(item, ['status', 'visible'], 'visible'),
    valoracion: pick(item, ['valoracion', 'rating', 'vote_average'], ''),
    idioma: pick(item, ['idioma', 'language', 'audio', 'audioLanguage', 'lang'], ''),
    subtitulos: pick(item, ['subtitulos', 'subtitles', 'subtitleLanguage', 'captionLanguage'], ''),
    categoria: 'movie',
    detailUrl: `/detail/movie/${id}`,
    watchUrl: `/watch/movie/${id}`,
  };
}

function normalizeEpisode(item) {
  const primaryUrl = isAllowedPlaybackUrl(pick(item, [
    'urlReproduccion',
    'streamUrl',
    'stream_url',
    'playbackUrl',
    'videoUrl',
    'embedUrl',
    'url',
  ]))
    ? pick(item, ['urlReproduccion', 'streamUrl', 'stream_url', 'playbackUrl', 'videoUrl', 'embedUrl', 'url'])
    : isAllowedPlaybackUrl(pick(item, ['urlReproduccion2', 'backupUrl', 'backup_url']))
      ? pick(item, ['urlReproduccion2', 'backupUrl', 'backup_url'])
      : null;

  return {
    serieId: pick(item, ['serieId', 'seriesId', 'showId']),
    temporada: Number(pick(item, ['temporada', 'season', 'seasonNumber'], 1)),
    episodio: Number(pick(item, ['episodio', 'episode', 'episodeNumber'], 1)),
    tituloEpisodio: pick(item, ['tituloEpisodio', 'title', 'name'], ''),
    urlReproduccion: primaryUrl,
    urlReproduccion2: null,
  };
}

function normalizeShow(item, category) {
  const id = String(pick(item, ['id', '_id', 'tmdbId', 'seriesId', 'showId', 'slug', 'contentId'], crypto.randomUUID()));
  const episodes = extractItems(pick(item, ['episodes', 'episodios'], [])).map(normalizeEpisode).filter((episode) => episode.urlReproduccion);

  return {
    id,
    titulo: pick(item, ['titulo', 'title', 'name', 'nombre'], titleFromId(id)),
    sinopsis: pick(item, ['sinopsis', 'overview', 'description', 'plot', 'descripcion'], ''),
    posterUrl: pickImage(item, ['posterUrl', 'poster', 'poster_path', 'image', 'cover', 'thumbnail']),
    backdropUrl: pickImage(item, ['backdropUrl', 'backdrop', 'backdrop_path', 'background', 'fanart']),
    logoUrl: pickImage(item, ['logoUrl', 'logo']),
    youtubeTrailer: pick(item, ['youtubeTrailer', 'trailer', 'trailerUrl']),
    genero: normalizeGenre(pick(item, ['genero', 'genre', 'genres', 'category'])),
    año: normalizeYear(pick(item, ['año', 'year', 'first_air_date', 'release_date', 'date'])),
    visible: pick(item, ['visible', 'status'], true),
    totalSeasons: Number(pick(item, ['totalSeasons', 'seasonsCount', 'temporadas'], 1)),
    totalEpisodes: Number(pick(item, ['totalEpisodes', 'episodesCount', 'episodios'], episodes.length)),
    seasons: Array.isArray(item.seasons) ? item.seasons : [],
    episodes,
    categoria: category,
    detailUrl: `/detail/${category}/${id}`,
  };
}

function extractItems(data) {
  if (Array.isArray(data)) return data;
  return pick(data, ['items', 'results', 'data', 'movies', 'series', 'anime', 'contents'], []);
}

async function fetchPaged(endpoint, cleaner) {
  if (isCustomCatalog) {
    const data = await fetchJson(endpoint);
    const items = extractItems(data).map(cleaner);
    return { total: Number(data?.total ?? items.length), items };
  }

  let offset = 0;
  let total = null;
  const items = [];

  while (total === null || offset < total) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const data = await fetchJson(`${endpoint}${separator}limit=${pageSize}&offset=${offset}`);
    const pageItems = extractItems(data);

    total = Number(data.total ?? pageItems.length);
    items.push(...pageItems.map(cleaner));

    if (pageItems.length === 0) break;
    offset += pageSize;
  }

  return { total: total ?? items.length, items };
}

function onlyPlayableMovies(movies) {
  const items = movies.items.filter((item) => (
    item.status === 'visible'
    && item.urlReproduccion
    && isAllowedPlaybackUrl(item.urlReproduccion)
  ));
  return { ...movies, total: items.length, items };
}

function onlySpanishMovies(movies) {
  if (!isCustomCatalog) return movies;
  const items = movies.items.filter(isSpanishItem);
  return { ...movies, total: items.length, items };
}

function yearRank(item) {
  const value = item?.año || item?.year || item?.releaseYear || item?.titulo || item?.title || '';
  const match = String(value).match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

function sortByYearDesc(catalog) {
  const items = [...catalog.items].sort((left, right) => {
    const yearDiff = yearRank(right) - yearRank(left);
    if (yearDiff !== 0) return yearDiff;
    return String(left.titulo || '').localeCompare(String(right.titulo || ''), 'es');
  });
  return { ...catalog, items };
}

function buildHomeFromCatalog(movies, series, anime) {
  const featured = [...movies.items, ...series.items, ...anime.items].slice(0, 18);
  return {
    destacados: featured,
    trending: movies.items.slice(0, 24),
    recientes: movies.items.slice(24, 48),
    series: series.items.slice(0, 24),
    anime: anime.items.slice(0, 24),
  };
}

function filterHomePlayableMovies(home) {
  const cleanValue = (value) => {
    if (!Array.isArray(value)) return value;
    return value.filter((item) => (
      item?.categoria !== 'movie'
      || (item.status === 'visible' && item.urlReproduccion && isAllowedPlaybackUrl(item.urlReproduccion))
    ));
  };

  return Object.fromEntries(Object.entries(home).map(([key, value]) => [key, cleanValue(value)]));
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function enrichShowsWithEpisodes(endpoint, category, shows) {
  if (isCustomCatalog) return shows;

  const enriched = await mapLimit(shows.items, 8, async (show) => {
    try {
      const detail = await fetchJson(`${endpoint}/${show.id}`);
      const detailSeries = detail.series || {};
      return {
        ...show,
        ...normalizeShow({ ...show, ...detailSeries }, category),
        seasons: Array.isArray(detail.seasons) ? detail.seasons : show.seasons || [],
        episodes: Array.isArray(detail.episodes)
          ? detail.episodes.map(normalizeEpisode).filter((episode) => episode.urlReproduccion)
          : [],
      };
    } catch (error) {
      console.warn(`No se pudieron sincronizar episodios de ${category} ${show.id}: ${error.message}`);
      return show;
    }
  });

  return { ...shows, items: enriched };
}

async function saveJson(filename, data) {
  await writeFile(new URL(filename, dataDir), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

await mkdir(dataDir, { recursive: true });

const [moviesRaw, seriesRaw, animeRaw] = await Promise.all([
  fetchPaged(endpoints.movies, normalizeMovie),
  fetchPaged(endpoints.series, (item) => normalizeShow(item, 'serie')),
  fetchPaged(endpoints.anime, (item) => normalizeShow(item, 'anime')),
]);

const playableMovies = sortByYearDesc(onlyPlayableMovies(onlySpanishMovies(moviesRaw)));

const [seriesWithEpisodes, animeWithEpisodes] = await Promise.all([
  enrichShowsWithEpisodes(endpoints.series, 'serie', seriesRaw),
  enrichShowsWithEpisodes(endpoints.anime, 'anime', animeRaw),
]);

const sortedSeries = sortByYearDesc(seriesWithEpisodes);
const sortedAnime = sortByYearDesc(animeWithEpisodes);

let home;
if (isCustomCatalog && !process.env.STREAMFLIX_HOME_ENDPOINT && !process.env.CATALOG_HOME_ENDPOINT) {
  home = buildHomeFromCatalog(playableMovies, sortedSeries, sortedAnime);
} else {
  home = filterHomePlayableMovies(await fetchJson(endpoints.home));
}

await Promise.all([
  saveJson('home.json', home),
  saveJson('movies.json', playableMovies),
  saveJson('series.json', sortedSeries),
  saveJson('anime.json', sortedAnime),
]);

console.log(
  `Datos sincronizados desde ${catalogBaseUrl}: ${playableMovies.items.length} peliculas disponibles, ${sortedSeries.items.length} series, ${sortedAnime.items.length} anime.`,
);
