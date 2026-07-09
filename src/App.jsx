import React, { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Captions,
  ChevronLeft,
  ChevronRight,
  Gauge,
  RotateCcw,
  RotateCw,
  Settings,
  Download,
  Filter,
  Film,
  Heart,
  Home,
  Info,
  Play,
  Plus,
  Radio,
  Search,
  Shuffle,
  Sparkles,
  Star,
  Tv,
  User,
  Volume2,
  X,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firebaseAuth, firebaseDb, isFirebaseConfigured } from './firebase';

const profiles = [
  { id: 'senor', name: 'Sr. M@umora', avatar: '/avatar-senor.png', color: '#e50914' },
  { id: 'senora', name: 'Sra. M@umora', avatar: '/avatar-senora.png', color: '#e91e9e' },
  { id: 'kids', name: 'Kids', avatar: '/avatar-kids.png', color: '#facc15' },
];

const heroItems = [
  {
    title: 'Horizonte Final',
    genre: 'Ciencia Ficcion  ?  Aventura  ?  Accion',
    year: '2026',
    age: '13+',
    description:
      'Una expedicion descubre una senal imposible al borde del sistema solar y desata una carrera por llegar primero.',
    backdrop:
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1800&q=85',
  },
  {
    title: 'Noches de NeÃƒÆ’Ã‚Â³n',
    genre: 'Thriller  ?  Crimen  ?  Misterio',
    year: '2025',
    age: '16+',
    description:
      'Un detective retirado vuelve a una ciudad llena de secretos para resolver el caso que nunca pudo cerrar.',
    backdrop:
      'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1800&q=85',
  },
  {
    title: 'La Magia en Casa',
    genre: 'Fantasia  ?  Familia  ?  Aventura',
    year: '2026',
    age: '7+',
    description:
      'Tres hermanos encuentran una sala de cine escondida que abre puertas a mundos que solo existen al proyectarlos.',
    backdrop:
      'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?auto=format&fit=crop&w=1800&q=85',
  },
];

const rows = [
  {
    title: 'Estrenos Recientes',
    variant: 'portrait',
    items: [
      ['Codigo Aurora', 'Accion', '2026'],
      ['El Ultimo Corte', 'Drama', '2025'],
      ['Sombras del Sur', 'Suspenso', '2026'],
      ['Ruta Salvaje', 'Aventura', '2024'],
      ['Ciudad Cero', 'Thriller', '2025'],
    ],
  },
  {
    title: 'Top 10 Peliculas en M@umora',
    variant: 'top',
    items: [
      ['Horizonte Final', 'Sci-Fi', '1'],
      ['Noches de NeÃƒÆ’Ã‚Â³n', 'Crimen', '2'],
      ['La Ultima Sala', 'Drama', '3'],
      ['Fuego Blanco', 'Accion', '4'],
      ['La Senal', 'Misterio', '5'],
    ],
  },
  {
    title: 'Series Recientes',
    variant: 'landscape',
    items: [
      ['Archivo Lunar', 'Serie', 'T1'],
      ['Distrito 9', 'Serie', 'T2'],
      ['Herencia Oscura', 'Serie', 'T1'],
      ['Mar Abierto', 'Serie', 'T3'],
    ],
  },
  {
    title: 'Anime Recientes',
    variant: 'landscape',
    items: [
      ['Neo Samurai', 'Anime', 'T1'],
      ['Orbe Azul', 'Anime', 'T2'],
      ['Kairo Zero', 'Anime', 'T1'],
      ['Estrella Norte', 'Anime', 'T4'],
    ],
  },
];

const movieRows = [
  {
    title: 'Peliculas',
    variant: 'portrait',
    items: [
      ['Codigo Aurora', 'Accion', '2026'],
      ['El Ultimo Corte', 'Drama', '2025'],
      ['Sombras del Sur', 'Suspenso', '2026'],
      ['Ruta Salvaje', 'Aventura', '2024'],
      ['Ciudad Cero', 'Thriller', '2025'],
      ['Horizonte Final', 'Sci-Fi', '2026'],
      ['Noches de Neon', 'Crimen', '2025'],
      ['La Ultima Sala', 'Drama', '2024'],
      ['Fuego Blanco', 'Accion', '2025'],
      ['La Senal', 'Misterio', '2026'],
      ['Tierra Roja', 'Western', '2023'],
      ['Viaje Lunar', 'Aventura', '2026'],
    ],
  },
  {
    title: 'Accion y Aventura',
    variant: 'portrait',
    items: [
      ['Codigo Aurora', 'Accion', '2026'],
      ['Ruta Salvaje', 'Aventura', '2024'],
      ['Fuego Blanco', 'Accion', '2025'],
      ['Horizonte Final', 'Sci-Fi', '2026'],
      ['Tierra Roja', 'Western', '2023'],
    ],
  },
  {
    title: 'Suspenso y Misterio',
    variant: 'portrait',
    items: [
      ['Sombras del Sur', 'Suspenso', '2026'],
      ['Noches de Neon', 'Crimen', '2025'],
      ['La Senal', 'Misterio', '2026'],
      ['El Ultimo Corte', 'Drama', '2025'],
    ],
  },
];

const posterImages = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=700&q=80',
];

const YEAR_LABEL = 'A\u00f1o';
const LIVE_CATALOG_ENDPOINTS = {
  movies: '',
  series: '',
  anime: '',
  home: '',
};
const LIVE_CATALOG_PAGE_SIZE = 120;

const fallbackTvSources = [
  { group: 'M3U.CL Espanol', name: 'M3U.CL Chile', url: 'https://www.m3u.cl/lista/CL.m3u' },
  { group: 'M3U.CL Espanol', name: 'M3U.CL Argentina', url: 'https://www.m3u.cl/lista/AR.m3u' },
  { group: 'M3U.CL Espanol', name: 'M3U.CL Espana', url: 'https://www.m3u.cl/lista/ES.m3u' },
  { group: 'M3U.CL Espanol', name: 'M3U.CL Mexico', url: 'https://www.m3u.cl/lista/MX.m3u' },
  { group: 'IPTV-ORG Espanol', name: 'IPTV-ORG Espanol', url: 'https://iptv-org.github.io/iptv/languages/spa.m3u' },
  { group: 'IPTV-ORG Espanol', name: 'IPTV-ORG America Hispanica', url: 'https://iptv-org.github.io/iptv/regions/hispam.m3u' },
  { group: 'IPTV-ORG Espanol', name: 'IPTV-ORG Chile', url: 'https://iptv-org.github.io/iptv/countries/cl.m3u' },
  { group: 'IPTV-ORG Espanol', name: 'IPTV-ORG Argentina', url: 'https://iptv-org.github.io/iptv/countries/ar.m3u' },
  { group: 'IPTV-ORG Espanol', name: 'IPTV-ORG Espana', url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
  { group: 'IPTV-ORG Espanol', name: 'IPTV-ORG Mexico', url: 'https://iptv-org.github.io/iptv/countries/mx.m3u' },
  { group: 'TDTChannels Espanol', name: 'TDTChannels TV', url: 'https://www.tdtchannels.com/lists/tv.m3u8' },
  { group: 'TDTChannels Espanol', name: 'TDTChannels Radio', url: 'https://www.tdtchannels.com/lists/radio.m3u8' },
  { group: 'TDTChannels Espanol', name: 'TDTChannels TV+Radio', url: 'https://www.tdtchannels.com/lists/tvradio.m3u8' },
  { group: 'Peliculas y series On Demand Latino', name: 'Dibujos animados', url: 'https://mametchikitty.github.io/Listas-IPTV/dibujos-animados.m3u' },
];

const PRIVATE_TV_PROXY_URL = import.meta.env.VITE_PRIVATE_TV_PROXY_URL || '';
const IS_NATIVE_APP = isNativeAppRuntime();
const PRIVATE_TV_LOCAL_LIST_URL = '/data/maumora-tv.m3u';
const WEB_STREAM_PROXY_URL = import.meta.env.VITE_WEB_STREAM_PROXY_URL || '';
const PRIVATE_IMPORT_LIMITS = {
  movies: 500,
  shows: 180,
  episodesPerShow: 80,
  tvChannels: 900,
};
const CHANNEL_FAVORITES_KEY = 'maumora-channel-favorites';
const FAVORITE_CHANNEL_CATEGORY = 'Favoritos';
const CUSTOM_M3U_LISTS_KEY = 'maumora-custom-m3u-lists';

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [path, setPath] = useState(() => window.location.pathname);
  const [realMovies, setRealMovies] = useState([]);
  const [realSeries, setRealSeries] = useState([]);
  const [realAnime, setRealAnime] = useState([]);
  const [privateCatalog, setPrivateCatalog] = useState({ movies: [], series: [], anime: [], tvChannels: null });
  const [tvData, setTvData] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [homeData, setHomeData] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('enygma-session') || 'null');
    } catch {
      return null;
    }
  });
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('enygma-favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [channelFavorites, setChannelFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CHANNEL_FAVORITES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [ratings, setRatings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('maumora-ratings') || '{}');
    } catch {
      return {};
    }
  });
  const [contentStats, setContentStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('maumora-content-stats') || '{}');
    } catch {
      return {};
    }
  });
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem('enygma-profile');
    if (savedProfile) return savedProfile;
    return ['/home', '/movies', '/series', '/anime', '/mylist'].includes(window.location.pathname) ||
      window.location.pathname.startsWith('/detail/')
      ? 'senor'
      : null;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashDone(true), 2100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleRoute = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  useEffect(() => {
    loadCatalogResource({
      localPath: '/data/movies.json',
      endpoint: LIVE_CATALOG_ENDPOINTS.movies,
      normalize: normalizeLiveMovie,
      transform: (items) => sortCatalogByYearDesc(items.filter((item) => item.status === 'visible' && item.urlReproduccion)),
      onLocal: setRealMovies,
      onLive: setRealMovies,
    });
  }, []);

  useEffect(() => {
    loadCatalogResource({
      localPath: '/data/series.json',
      endpoint: LIVE_CATALOG_ENDPOINTS.series,
      normalize: (item) => normalizeLiveShow(item, 'serie'),
      transform: sortCatalogByYearDesc,
      onLocal: setRealSeries,
      onLive: setRealSeries,
    });
  }, []);

  useEffect(() => {
    loadCatalogResource({
      localPath: '/data/anime.json',
      endpoint: LIVE_CATALOG_ENDPOINTS.anime,
      normalize: (item) => normalizeLiveShow(item, 'anime'),
      transform: sortCatalogByYearDesc,
      onLocal: setRealAnime,
      onLive: setRealAnime,
    });
  }, []);

  useEffect(() => {
    loadHomeResource(setHomeData);
  }, []);

  useEffect(() => {
    fetch('/data/tv.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setTvData(Array.isArray(data?.sources) ? data.sources : []))
      .catch(() => setTvData([]));
  }, []);

  useEffect(() => {
    if (!PRIVATE_TV_PROXY_URL) return;

    let cancelled = false;
    const requestOptions = { headers: { accept: 'application/x-mpegurl,text/plain,*/*' } };

    const catalogUrl = PRIVATE_TV_LOCAL_LIST_URL;
    const tvUrl = PRIVATE_TV_LOCAL_LIST_URL;

    fetch(catalogUrl, requestOptions)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(`${response.status} ${response.statusText}`))))
      .then((text) => {
        if (!cancelled) setPrivateCatalog(parsePrivateM3uCatalog(text));
      })
      .catch(() => {
        if (!cancelled) setPrivateCatalog({ movies: [], series: [], anime: [], tvChannels: [] });
      });

    fetch(tvUrl, requestOptions)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(`${response.status} ${response.statusText}`))))
      .then((text) => {
        if (cancelled) return;
        const tvChannels = parseM3u(text, 'M@umora TV privada')
          .filter((channel) => !isRadioChannel(channel, { name: 'M@umora TV privada', group: 'M@umora privado' }) && !isVodChannel(channel, { name: 'M@umora TV privada', group: 'M@umora privado' }))
          .filter((channel) => isValidChannelTitle(channel.name))
          .reduce(dedupeChannelsReducer, [])
          .slice(0, PRIVATE_IMPORT_LIMITS.tvChannels);
        setPrivateCatalog((current) => ({ ...current, tvChannels }));
      })
      .catch(() => {
        if (!cancelled) setPrivateCatalog((current) => ({ ...current, tvChannels: [] }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!firebaseDb) return undefined;
    const statsQuery = query(collection(firebaseDb, 'contentStats'), orderBy('views', 'desc'), limit(30));
    return onSnapshot(
      statsQuery,
      (snapshot) => {
        const next = {};
        snapshot.forEach((entry) => {
          next[entry.id] = entry.data();
        });
        setContentStats((current) => {
          const merged = { ...current, ...next };
          localStorage.setItem('maumora-content-stats', JSON.stringify(merged));
          return merged;
        });
      },
      () => {},
    );
  }, []);

  const selectedProfile = profiles.find((item) => item.id === profile) || profiles[0];

  const navigate = (nextPath) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };
  const toggleFavorite = (item) => {
    if (!item) return;
    const normalized = {
      id: item.id,
      titulo: item.titulo,
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      genero: item.genero,
      año: item.año,
      categoria: item.categoria || 'movie',
      detailUrl: item.detailUrl || `/detail/${item.categoria === 'serie' ? 'serie' : item.categoria || 'movie'}/${item.id}`,
    };
    const category = item.categoria || 'movie';
    const typePath = category === 'serie' ? 'serie' : category === 'anime' ? 'anime' : 'movie';
    const favoriteId = item.id || item.titulo || item.title;
    if (!favoriteId) return;
    Object.assign(normalized, {
      id: favoriteId,
      titulo: item.titulo || item.title,
      posterUrl: item.posterUrl || item.backdropUrl || item.backdrop,
      backdropUrl: item.backdropUrl || item.backdrop || item.posterUrl,
      genero: item.genero || item.genre,
      categoria: category,
      detailUrl: item.detailUrl || `/detail/${typePath}/${favoriteId}`,
    });
    setFavorites((current) => {
      const exists = current.some((favorite) => favorite.id === normalized.id && favorite.categoria === normalized.categoria);
      const next = exists
        ? current.filter((favorite) => !(favorite.id === normalized.id && favorite.categoria === normalized.categoria))
        : [normalized, ...current];
      localStorage.setItem('enygma-favorites', JSON.stringify(next));
      return next;
    });
  };

  const toggleChannelFavorite = (channel, source, mode = 'tv') => {
    if (!channel?.url) return;
    const normalized = normalizeChannelFavorite(channel, source, mode);
    setChannelFavorites((current) => {
      const exists = current.some((favorite) => favorite.id === normalized.id);
      const next = exists
        ? current.filter((favorite) => favorite.id !== normalized.id)
        : [normalized, ...current];
      localStorage.setItem(CHANNEL_FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const rateContent = async (category, id, rating) => {
    if (!category || !id) return;
    const ratingKey = `${currentUser?.id || 'local'}:${category}:${id}`;
    setRatings((current) => {
      const next = { ...current, [ratingKey]: rating };
      localStorage.setItem('maumora-ratings', JSON.stringify(next));
      return next;
    });

    if (!firebaseDb || !currentUser?.id) return;
    const contentKey = `${category}:${id}`;
    const userRatingRef = doc(firebaseDb, 'contentRatings', `${contentKey}:${currentUser.id}`);
    const statsRef = doc(firebaseDb, 'contentStats', contentKey);

    try {
      await runTransaction(firebaseDb, async (transaction) => {
        const ratingDoc = await transaction.get(userRatingRef);
        const previousRating = Number(ratingDoc.data()?.rating || 0);
        const ratingDelta = Number(rating) - previousRating;
        transaction.set(
          userRatingRef,
          {
            category,
            contentId: id,
            userId: currentUser.id,
            rating,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        transaction.set(
          statsRef,
          {
            category,
            contentId: id,
            ratingSum: increment(ratingDelta),
            ratingCount: increment(previousRating ? 0 : 1),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      });
    } catch {
      // localStorage mantiene la calificacion si Firestore no responde.
    }
  };

  const recordContentView = async (category, item) => {
    const id = item?.id;
    if (!category || !id) return;
    const key = `${category}:${id}`;
    setContentStats((current) => {
      const existing = current[key] || {};
      const next = {
        ...current,
        [key]: {
          ...existing,
          views: Number(existing.views || 0) + 1,
          updatedAt: Date.now(),
        },
      };
      localStorage.setItem('maumora-content-stats', JSON.stringify(next));
      return next;
    });

    if (!firebaseDb) return;
    try {
      await setDoc(
        doc(firebaseDb, 'contentStats', key),
        {
          category,
          contentId: id,
          title: item.titulo || item.title || '',
          posterUrl: item.posterUrl || '',
          backdropUrl: item.backdropUrl || '',
          genre: item.genero || '',
          year: item.año || item.year || '',
          views: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch {
      // localStorage mantiene la vista si Firestore no responde.
    }
  };

  const selectProfile = (id) => {
    localStorage.setItem('enygma-profile', id);
    setProfile(id);
    navigate('/home');
  };
  const handleAuth = (user) => {
    localStorage.setItem('enygma-session', JSON.stringify(user));
    setCurrentUser(user);
    navigate('/home');
  };
  const logout = () => {
    localStorage.removeItem('enygma-session');
    localStorage.removeItem('enygma-profile');
    setCurrentUser(null);
    setProfile(null);
    navigate('/');
  };
  const allMovies = mergeCatalogItems(realMovies, privateCatalog.movies);
  const allSeries = mergeCatalogItems(realSeries, privateCatalog.series);
  const allAnime = mergeCatalogItems(realAnime, privateCatalog.anime);
  const allTvData = withPrivateTvSource([], privateCatalog.tvChannels);

  if (!splashDone) {
    return <Splash />;
  }

  if (!currentUser) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <HomeScreen
      profile={selectedProfile}
      currentUser={currentUser}
      onLogout={logout}
      path={path}
      navigate={navigate}
      movies={allMovies}
      series={allSeries}
      anime={allAnime}
      homeData={homeData}
      favorites={favorites}
      toggleFavorite={toggleFavorite}
      channelFavorites={channelFavorites}
      toggleChannelFavorite={toggleChannelFavorite}
      ratings={ratings}
      rateContent={rateContent}
      contentStats={contentStats}
      recordContentView={recordContentView}
      tvData={allTvData}
      searchOpen={searchOpen}
      setSearchOpen={setSearchOpen}
    />
  );
}

function Splash() {
  return (
    <main className="splash-screen">
      <div className="splash-glow" />
      <img src="/maumora-logo.svg" alt="M@umora" className="splash-logo" />
      <div className="splash-word">
        <span>M</span>
        <strong>@</strong>
        <span>umora</span>
      </div>
      <p>CINE</p>
      <div className="load-track">
        <span />
      </div>
    </main>
  );
}

function ProfilePicker({ onSelect }) {
  return (
    <main className="profile-screen">
      <div className="profile-bg" />
      <section className="profile-content">
        <img src="/maumora-logo.svg" alt="M@umora" className="profile-logo" />
        <div className="profile-title">
          <span>M</span>
          <strong>@</strong>
          <span>umora</span>
        </div>
        <h1>Ãƒâ€šÃ‚Â¿Quien esta viendo?</h1>

        <div className="profile-grid">
          {profiles.map((item) => (
            <button
              className="profile-card"
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{ '--profile-color': item.color }}
            >
              <span className="avatar-frame">
                <img src={item.avatar} alt={item.name} />
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const readUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('enygma-users') || '[]');
    } catch {
      return [];
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    setError('');

    if (!cleanEmail || !password || (mode === 'register' && !cleanName)) {
      setError('Completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La clave debe tener minimo 6 caracteres.');
      return;
    }

    if (isFirebaseConfigured && firebaseAuth) {
      try {
        if (mode === 'register') {
          const credential = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
          await updateProfile(credential.user, { displayName: cleanName });
          onAuth({
            id: credential.user.uid,
            name: cleanName,
            email: credential.user.email,
          });
          return;
        }

        const credential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        onAuth({
          id: credential.user.uid,
          name: credential.user.displayName || credential.user.email?.split('@')[0] || 'Usuario',
          email: credential.user.email,
        });
        return;
      } catch (authError) {
        setError(getFirebaseAuthMessage(authError.code));
        return;
      }
    }

    const users = readUsers();

    if (mode === 'register') {
      if (users.some((user) => user.email === cleanEmail)) {
        setError('Ese correo ya esta registrado.');
        return;
      }

      const newUser = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password,
      };
      localStorage.setItem('enygma-users', JSON.stringify([newUser, ...users]));
      onAuth({ id: newUser.id, name: newUser.name, email: newUser.email });
      return;
    }

    const foundUser = users.find((user) => user.email === cleanEmail && user.password === password);
    if (!foundUser) {
      setError('Correo o clave incorrectos.');
      return;
    }

    onAuth({ id: foundUser.id, name: foundUser.name, email: foundUser.email });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <main className="auth-screen">
      <div className="auth-bg" />
      <section className="auth-panel" aria-label="Acceso a M@umora">
        <img src="/maumora-logo.svg" alt="M@umora" className="auth-logo" />
        <div className="auth-title">
          <span>M</span>
          <strong>@</strong>
          <span>umora</span>
        </div>
        <p className="auth-subtitle">{mode === 'login' ? 'Entra a tu cuenta' : 'Crea tu cuenta'}</p>

        <div className="auth-tabs" role="tablist" aria-label="Modo de acceso">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')} type="button">
            Entrar
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} type="button">
            Registro
          </button>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          {mode === 'register' && (
            <label className="auth-field">
              <span>Nombre</span>
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </label>
          )}
          <label className="auth-field">
            <span>Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="auth-field">
            <span>Clave</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" type="submit">
            {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
          </button>
        </form>
      </section>
    </main>
  );
}

function getFirebaseAuthMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'Ese correo ya esta registrado.',
    'auth/invalid-email': 'El correo no es valido.',
    'auth/invalid-credential': 'Correo o clave incorrectos.',
    'auth/user-not-found': 'Correo o clave incorrectos.',
    'auth/wrong-password': 'Correo o clave incorrectos.',
    'auth/weak-password': 'La clave debe tener minimo 6 caracteres.',
    'auth/network-request-failed': 'No se pudo conectar con Firebase.',
  };
  return messages[code] || 'No se pudo completar el acceso.';
}

function HomeScreen({
  profile,
  currentUser,
  onLogout,
  path,
  navigate,
  movies,
  series,
  anime,
  homeData,
  favorites,
  toggleFavorite,
  channelFavorites,
  toggleChannelFavorite,
  ratings,
  rateContent,
  contentStats,
  recordContentView,
  tvData,
  searchOpen,
  setSearchOpen,
}) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [requestOpen, setRequestOpen] = useState(false);
  const bannerItems = homeData?.banner?.length ? homeData.banner : heroItems;
  const hero = bannerItems[heroIndex % bannerItems.length];
  const isWatchPath = path.startsWith('/watch/');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % Math.max(bannerItems.length, 1));
    }, 6500);
    return () => window.clearInterval(timer);
  }, [bannerItems.length]);

  return (
    <main className="app-shell">
      {!isWatchPath && (
        <Header
          profile={profile}
          currentUser={currentUser}
          onLogout={onLogout}
          path={path}
          navigate={navigate}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      {searchOpen && (
        <SearchOverlay
          movies={movies}
          series={series}
          anime={anime}
          tvData={tvData}
          navigate={navigate}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {path === '/movies' ? (
        <MoviesScreen movies={movies} navigate={navigate} contentStats={contentStats} />
      ) : path === '/series' ? (
        <SeriesScreen series={series} navigate={navigate} contentStats={contentStats} />
      ) : path === '/anime' ? (
        <AnimeScreen anime={anime} navigate={navigate} contentStats={contentStats} />
      ) : path === '/tv' ? (
        <TvLiveScreen mode="tv" tvData={tvData} channelFavorites={channelFavorites} toggleChannelFavorite={toggleChannelFavorite} />
      ) : path === '/radio' ? (
        <TvLiveScreen mode="radio" tvData={tvData} channelFavorites={channelFavorites} toggleChannelFavorite={toggleChannelFavorite} />
      ) : path === '/mylist' ? (
        <MyListScreen favorites={favorites} navigate={navigate} toggleFavorite={toggleFavorite} />
      ) : path.startsWith('/detail/movie/') ? (
        <MovieDetail
          movie={movies.find((item) => item.id === path.split('/').pop())}
          isLoading={movies.length === 0}
          navigate={navigate}
          toggleFavorite={toggleFavorite}
        />
      ) : path.startsWith('/detail/serie/') ? (
        <SeriesDetail
          serie={series.find((item) => item.id === path.split('/').pop())}
          isLoading={series.length === 0}
          navigate={navigate}
        />
      ) : path.startsWith('/detail/anime/') ? (
        <SeriesDetail
          serie={anime.find((item) => item.id === path.split('/').pop())}
          isLoading={anime.length === 0}
          navigate={navigate}
          typeLabel="Anime"
          backPath="/anime"
          contentType="anime"
        />
      ) : path.startsWith('/episodes/serie/') ? (
        <EpisodesScreen
          serie={series.find((item) => item.id === path.split('/').pop())}
          isLoading={series.length === 0}
          navigate={navigate}
          type="serie"
          backPath={`/detail/serie/${path.split('/').pop()}`}
        />
      ) : path.startsWith('/episodes/anime/') ? (
        <EpisodesScreen
          serie={anime.find((item) => item.id === path.split('/').pop())}
          isLoading={anime.length === 0}
          navigate={navigate}
          type="anime"
          backPath={`/detail/anime/${path.split('/').pop()}`}
        />
      ) : path.startsWith('/watch/serie/') ? (
        <EpisodeWatchScreen
          serie={series.find((item) => item.id === path.split('/')[3])}
          episode={findEpisodeFromPath(series, path)}
          isLoading={series.length === 0}
          navigate={navigate}
          type="serie"
          rating={ratings[`${currentUser?.id}:serie:${path.split('/')[3]}`] || 0}
          onRate={(rating) => rateContent('serie', path.split('/')[3], rating)}
          onViewed={() => recordContentView('serie', series.find((item) => item.id === path.split('/')[3]))}
        />
      ) : path.startsWith('/watch/anime/') ? (
        <EpisodeWatchScreen
          serie={anime.find((item) => item.id === path.split('/')[3])}
          episode={findEpisodeFromPath(anime, path)}
          isLoading={anime.length === 0}
          navigate={navigate}
          type="anime"
          rating={ratings[`${currentUser?.id}:anime:${path.split('/')[3]}`] || 0}
          onRate={(rating) => rateContent('anime', path.split('/')[3], rating)}
          onViewed={() => recordContentView('anime', anime.find((item) => item.id === path.split('/')[3]))}
        />
      ) : path.startsWith('/watch/movie/') ? (
        <WatchScreen
          movie={movies.find((item) => item.id === path.split('/').pop())}
          isLoading={movies.length === 0}
          navigate={navigate}
          rating={ratings[`${currentUser?.id}:movie:${path.split('/').pop()}`] || 0}
          onRate={(rating) => rateContent('movie', path.split('/').pop(), rating)}
          onViewed={() => recordContentView('movie', movies.find((item) => item.id === path.split('/').pop()))}
        />
      ) : (
        <HomePage
          hero={hero}
          items={bannerItems}
          heroIndex={heroIndex}
          setHeroIndex={setHeroIndex}
          homeData={homeData}
          navigate={navigate}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          contentStats={contentStats}
        />
      )}

      {!isWatchPath && (
        <button className="request-button" onClick={() => setRequestOpen(true)} aria-label="Pedir contenido">
          <Plus size={28} />
        </button>
      )}

      {!isWatchPath && <Footer />}
      {!isWatchPath && <MobileNav path={path} navigate={navigate} />}
      {requestOpen && <RequestModal onClose={() => setRequestOpen(false)} />}
    </main>
  );
}

function Footer() {
  return <footer className="site-footer">Todos los derechos reservados @ M@umora</footer>;
}

function HomePage({
  hero,
  items,
  heroIndex,
  setHeroIndex,
  homeData,
  navigate,
  favorites,
  toggleFavorite,
  contentStats,
}) {
  const realHero = {
    id: hero?.id,
    title: hero?.titulo || hero?.title,
    genre: hero?.genero || hero?.genre || '',
    year: hero?.año || hero?.year,
    age: hero?.edadRecomendada || hero?.age,
    description: hero?.sinopsis || hero?.description,
    backdrop: hero?.backdropUrl || hero?.backdrop,
    categoria: hero?.categoria || 'movie',
  };

  const mostViewedItems = buildMostViewedItems(homeData, contentStats);
  const homeRows = homeData
    ? [
        ['Mas visto en M@umora', mostViewedItems, 'mixed', 'top'],
        ['Estrenos Recientes', homeData.latestMovies, 'movie', 'portrait'],
        ['Top 10 Peliculas en M@umora', homeData.top10, 'movie', 'top'],
        ['Top 10 Series en M@umora', homeData.top10Series, 'serie', 'top'],
        ['Tendencias', homeData.trending, 'movie', 'landscape'],
        ['Series Recientes', homeData.latestSeries, 'serie', 'landscape'],
        ['Anime Recientes', homeData.latestAnime, 'anime', 'landscape'],
        ['Recomendados', homeData.recommended, 'movie', 'portrait'],
      ].filter(([, rowItems]) => Array.isArray(rowItems) && rowItems.length > 0)
    : [];
  const goPrevHero = () => setHeroIndex((current) => (current - 1 + items.length) % items.length);
  const goNextHero = () => setHeroIndex((current) => (current + 1) % items.length);
  const heroFavoriteId = hero?.id || hero?.titulo || hero?.title;
  const heroCategory = hero?.categoria || 'movie';
  const isHeroFavorite = favorites?.some(
    (item) => item.id === heroFavoriteId && item.categoria === heroCategory,
  );

  return (
    <>
      <section className="hero" aria-label="Contenido destacado">
        <img src={realHero.backdrop} alt="" className="hero-image" />
        <div className="hero-vignette" />
        <div className="hero-content">
          <p className="eyebrow">Destacado en M@umora</p>
          <h1>{realHero.title}</h1>
          {realHero.genre && <p className="hero-genre">{realHero.genre.split(',').slice(0, 3).join(' - ')}</p>}
          <div className="hero-meta">
            {realHero.age && <span>{realHero.age}+</span>}
            {realHero.year && <span>{realHero.year}</span>}
            <span>4K HDR</span>
          </div>
          {realHero.description && <p className="hero-copy">{realHero.description}</p>}
          <div className="hero-actions">
            <button
              className="primary-action"
              onClick={() => realHero.id && navigate(`/watch/movie/${realHero.id}`)}
            >
              <Play size={19} fill="currentColor" />
              Ver ahora
            </button>
            <button
              className="secondary-action"
              onClick={() => realHero.id && navigate(`/detail/movie/${realHero.id}`)}
            >
              <Info size={19} />
              Ver info
            </button>
            <button
              className={`icon-action ${isHeroFavorite ? 'active' : ''}`}
              aria-label={isHeroFavorite ? 'Quitar de Mi Lista' : 'Agregar a Mi Lista'}
              onClick={() => toggleFavorite?.(hero)}
            >
              <Heart size={20} fill={isHeroFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        {items.length > 1 && (
          <>
            <button className="hero-arrow hero-arrow-left" onClick={goPrevHero} aria-label="Anterior">
              <ChevronLeft size={26} />
            </button>
            <button className="hero-arrow hero-arrow-right" onClick={goNextHero} aria-label="Siguiente">
              <ChevronRight size={26} />
            </button>
          </>
        )}
        <div className="hero-dots">
          {items.map((item, index) => (
            <button
              key={item.id || item.titulo || item.title}
              aria-label={`Ver ${item.titulo || item.title}`}
              className={index === heroIndex ? 'active' : ''}
              onClick={() => setHeroIndex(index)}
            />
          ))}
        </div>
      </section>

      <section className="content-area">
        <button className="roulette-button">
          <Shuffle size={18} />
          Ruleta Cine
        </button>

        {(homeRows.length ? homeRows : rows.map((row) => [row.title, null, 'movie', row.variant])).map(
          ([title, rowItems, type, variant]) => (
            <Rail
              key={title}
              row={
                rowItems
                  ? { title, variant, items: toRailItems(rowItems, type), contentStats }
                  : rows.find((row) => row.title === title)
              }
              navigate={navigate}
            />
          ),
        )}
      </section>
    </>
  );
}

function toRailItems(items, type) {
  return items.map((item, index) => [
    item.titulo,
    item.genero?.split(',')[0] || item.categoria || type,
    formatYearLabel(item.año || item.year || item.releaseYear || item.titulo),
    {
      ...item,
      detailUrl: `/detail/${getCatalogPath(item.categoria || type)}/${item.id}`,
      watchUrl: getCatalogPath(item.categoria || type) === 'movie' ? `/watch/movie/${item.id}` : null,
    },
  ]);
}

function getCatalogPath(category) {
  if (category === 'serie' || category === 'series') return 'serie';
  if (category === 'anime') return 'anime';
  return 'movie';
}

function buildMostViewedItems(homeData, contentStats = {}) {
  if (!homeData || !contentStats || Object.keys(contentStats).length === 0) return [];
  const sources = [
    homeData.latestMovies,
    homeData.top10,
    homeData.trending,
    homeData.recommended,
    homeData.latestSeries,
    homeData.top10Series,
    homeData.latestAnime,
  ].filter(Array.isArray);
  const byKey = new Map();
  sources.flat().forEach((item) => {
    const category = getCatalogPath(item.categoria || 'movie');
    const key = `${category}:${item.id}`;
    if (!byKey.has(key)) byKey.set(key, { ...item, categoria: category });
  });
  Object.entries(contentStats).forEach(([key, stat]) => {
    if (byKey.has(key) || !stat?.contentId) return;
    byKey.set(key, {
      id: stat.contentId,
      titulo: stat.title || 'Contenido visto',
      posterUrl: stat.posterUrl,
      backdropUrl: stat.backdropUrl,
      genero: stat.genre,
      año: stat.year,
      categoria: getCatalogPath(stat.category),
    });
  });

  return [...byKey.values()]
    .map((item) => ({
      ...item,
      localViews: Number(contentStats[`${getCatalogPath(item.categoria)}:${item.id}`]?.views || 0),
    }))
    .filter((item) => item.localViews > 0)
    .sort((left, right) => right.localViews - left.localViews)
    .slice(0, 10);
}

function Header({ profile, currentUser, onLogout, path, navigate, onOpenSearch }) {
  const links = [
    ['/home', 'Inicio'],
    ['/movies', 'Peliculas'],
    ['/series', 'Series'],
    ['/anime', 'Anime'],
    ['/tv', 'TV'],
    ['/radio', 'Radio'],
    ['/mylist', 'Mi Lista'],
  ];

  return (
    <header className="topbar">
      <button className="logo-button" onClick={() => navigate('/home')} aria-label="Ir al inicio">
        <img src="/maumora-logo.svg" alt="M@umora" />
      </button>
      <nav className="desktop-nav" aria-label="Navegacion principal">
        {links.map(([href, label]) => (
          <a
            href={href}
            key={href}
            className={`${path === href ? 'active' : ''} ${label === 'Anime' ? 'anime-link' : ''}`}
            onClick={(event) => {
              event.preventDefault();
              navigate(href);
            }}
          >
            {label === 'Anime' && <img src="/anime-logo.png" alt="" />}
            {label}
          </a>
        ))}
      </nav>
      <div className="top-actions">
        <button aria-label="Buscar" onClick={onOpenSearch} type="button">
          <Search size={20} />
        </button>
        <span className="user-name">{currentUser?.name}</span>
        <button className="logout-button" onClick={onLogout} type="button">
          Salir
        </button>
      </div>
    </header>
  );
}

function SearchOverlay({ movies, series, anime, tvData, navigate, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const results = useMemo(() => {
    const search = normalizeText(query);
    if (search.length < 2) return [];

    const contentResults = [
      ...movies.map((item) => ({
        id: `movie-${item.id}`,
        title: item.titulo,
        meta: formatGenreYear(item.genero?.split(',')[0], item.año),
        image: item.posterUrl,
        label: 'Pelicula',
        href: `/detail/movie/${item.id}`,
      })),
      ...series.map((item) => ({
        id: `serie-${item.id}`,
        title: item.titulo,
        meta: formatGenreYear(item.genero?.split(',')[0], item.año),
        image: item.posterUrl,
        label: 'Serie',
        href: `/detail/serie/${item.id}`,
      })),
      ...anime.map((item) => ({
        id: `anime-${item.id}`,
        title: item.titulo,
        meta: formatGenreYear(item.genero?.split(',')[0], item.año),
        image: item.posterUrl,
        label: 'Anime',
        href: `/detail/anime/${item.id}`,
      })),
    ].filter((item) => normalizeText(`${item.title} ${item.meta} ${item.label}`).includes(search));

    const channelResults = tvData.flatMap((source) => (
      (source.channels || []).map((channel) => {
        const radio = isRadioChannel(channel, source);
        if (isVodChannel(channel, source)) return null;
        return {
          id: `${radio ? 'radio' : 'tv'}-${source.name}-${channel.name}-${channel.url}`,
          title: channel.name,
          meta: [source.name, channel.group].filter(Boolean).join(' - '),
          image: channel.logo,
          label: radio ? 'Radio' : 'TV',
          href: radio ? '/radio' : '/tv',
        };
      }).filter(Boolean)
    )).filter((item) => normalizeText(`${item.title} ${item.meta} ${item.label}`).includes(search));

    return [...contentResults, ...channelResults].slice(0, 60);
  }, [anime, movies, query, series, tvData]);

  const openResult = (href) => {
    navigate(href);
    onClose();
  };

  return (
    <div className="search-layer" role="dialog" aria-modal="true" aria-label="Buscar contenido">
      <button className="search-backdrop" onClick={onClose} aria-label="Cerrar busqueda" />
      <section className="search-panel">
        <div className="search-input-row">
          <Search size={22} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar peliculas, series, anime, TV o radio"
          />
          <button onClick={onClose} type="button" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="search-results">
          {query.trim().length < 2 ? (
            <p>Escribe al menos 2 letras para buscar.</p>
          ) : results.length ? (
            results.map((item) => (
              <button key={item.id} onClick={() => openResult(item.href)} type="button">
                {item.image ? <img src={item.image} alt="" /> : <span>{item.label.slice(0, 1)}</span>}
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.label} - {item.meta}</small>
                </div>
              </button>
            ))
          ) : (
            <p>No encontre resultados para "{query}".</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MoviesScreen({ movies, navigate, contentStats }) {
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState(YEAR_LABEL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);
  const genres = ['Todos', 'Accion', 'Comedia', 'Drama', 'Terror', 'Thriller', 'Ciencia Ficcion', 'Aventura'];
  const years = [YEAR_LABEL, '2026', '2025', '2024', '2023'];
  const sourceMovies =
    movies.length > 0
      ? movies
      : movieRows[0].items.map(([title, category, year], index) => ({
          id: `mock-${index}`,
          titulo: title,
          genero: category,
          año: year,
          posterUrl: posterImages[index % posterImages.length],
          backdropUrl: posterImages[(index + 2) % posterImages.length],
          valoracion: '',
          detailUrl: `/detail/movie/mock-${index}`,
        }));
  const allMovies = sortCatalogByYearDesc(sourceMovies);
  const filteredMovies =
    selectedGenre === 'Todos' && selectedYear === YEAR_LABEL
      ? allMovies
      : allMovies.filter((item) => {
          const genreMatch =
            selectedGenre === 'Todos' || normalizeText(item.genero || '').includes(normalizeText(selectedGenre));
          const yearMatch = selectedYear === YEAR_LABEL || item.año === selectedYear;
          return genreMatch && yearMatch;
        });
  const visibleMovies = filteredMovies.length > 0 ? filteredMovies : allMovies;
  const publicVisibleMovies = visibleMovies.filter((item) => !item.privateSource);
  const featuredSourceMovies = publicVisibleMovies.length ? publicVisibleMovies : visibleMovies;
  const featureMovies = featuredSourceMovies.filter((item) => item.backdropUrl || item.posterUrl).slice(0, 8);
  const featuredMovie = featureMovies[featureIndex % Math.max(featureMovies.length, 1)] ?? visibleMovies[0];
  const topMovies = (publicVisibleMovies.length ? publicVisibleMovies : visibleMovies)
    .filter((item) => item.posterUrl)
    .slice(0, 10)
    .map((item) => [item.titulo, item.genero?.split(',')[0] || 'Pelicula', formatYearLabel(item.año || item.titulo), item]);
  const goPrevFeature = () =>
    setFeatureIndex((current) => (current - 1 + Math.max(featureMovies.length, 1)) % Math.max(featureMovies.length, 1));
  const goNextFeature = () => setFeatureIndex((current) => (current + 1) % Math.max(featureMovies.length, 1));

  useEffect(() => {
    if (featureMovies.length < 2) return undefined;
    const timer = window.setInterval(goNextFeature, 6200);
    return () => window.clearInterval(timer);
  }, [featureMovies.length]);

  useEffect(() => {
    setFeatureIndex(0);
  }, [selectedGenre, selectedYear]);

  return (
    <section className="catalog-page">
      <div className="movies-feature">
        <img src={featuredMovie?.backdropUrl || featuredMovie?.posterUrl} alt="" />
        <div className="movies-feature-overlay" />
        <div className="movies-feature-content">
          <h1>{featuredMovie?.titulo || 'Peliculas'}</h1>
          <div className="movie-mini-meta">
            {featuredMovie?.valoracion && <span>{Number(featuredMovie.valoracion).toFixed(1)}</span>}
            {featuredMovie?.año && <span>{formatYearLabel(featuredMovie.año)}</span>}
          </div>
          {featuredMovie?.sinopsis && <p>{featuredMovie.sinopsis}</p>}
          <div className="hero-dots movies-dots">
            {featureMovies.map((item, index) => (
              <button
                key={item.id || item.titulo}
                className={index === featureIndex % Math.max(featureMovies.length, 1) ? 'active' : ''}
                aria-label={item.titulo}
                onClick={() => setFeatureIndex(index)}
              />
            ))}
          </div>
        </div>
        {featureMovies.length > 1 && (
          <>
            <button className="hero-arrow hero-arrow-left" onClick={goPrevFeature} aria-label="Anterior">
              <ChevronLeft size={28} />
            </button>
            <button className="hero-arrow hero-arrow-right" onClick={goNextFeature} aria-label="Siguiente">
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      <div className="movies-topten">
        <Rail row={{ title: 'Top 10 Peliculas en M@umora', variant: 'top', items: topMovies }} navigate={navigate} />
      </div>

      <div className="catalog-controls">
        <div className="genre-chips">
          {genres.map((genre, index) => (
            <button
              className={selectedGenre === genre ? 'selected' : ''}
              key={genre}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
        <label className="year-filter">
          <span>{YEAR_LABEL}</span>
          <select
            className="year-select"
            aria-label="Filtrar por año"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </label>
        <button className="filter-button" onClick={() => setFiltersOpen((value) => !value)}>
          <Filter size={17} />
          Filtros
        </button>
      </div>

      {filtersOpen && (
        <div className="filters-panel">
          <div>
            <span>Genero</span>
            <div className="filter-grid">
              {genres.map((genre) => (
                <button
                  className={selectedGenre === genre ? 'selected' : ''}
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span>{YEAR_LABEL}</span>
            <div className="filter-grid year-grid">
              {years.map((year) => (
                <button
                  className={selectedYear === year ? 'selected' : ''}
                  key={year}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          <button
            className="clear-filters"
            onClick={() => {
              setSelectedGenre('Todos');
              setSelectedYear(YEAR_LABEL);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="movie-count">{visibleMovies.length.toLocaleString('es')} titulos</div>

      <div className="movies-grid-wrap">
        <div className="movies-grid">
          {visibleMovies.map((item) => (
            <a
              className={`movie-grid-card ${item.privateSource ? 'private-media-card' : ''}`}
              href={item.detailUrl || `/detail/movie/${item.id}`}
              key={item.id}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.detailUrl || `/detail/movie/${item.id}`);
              }}
            >
              <span className="hover-info">
                <strong>{item.titulo}</strong>
                <small>{formatGenreYear(item.genero?.split(',')[0], item.año)}</small>
              </span>
              <div className={`movie-grid-poster ${item.privateSource ? 'private-media-poster' : ''}`}>
                <img src={item.posterUrl} alt="" loading="lazy" />
                <RatingBadge item={item} category="movie" contentStats={contentStats} />
                <span className="grid-play" aria-label={`Ver ${item.titulo}`}>
                  <Play size={18} fill="currentColor" />
                </span>
                <span className="card-title-strip">
                  <strong>{item.titulo}</strong>
                  <small>{formatGenreYear(item.genero?.split(',')[0], item.año)}</small>
                </span>
              </div>
              <h2>{item.titulo}</h2>
              <p>{item.año}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeriesScreen({ series, navigate, contentStats }) {
  const [featureIndex, setFeatureIndex] = useState(0);
  const allSeries = sortCatalogByYearDesc(series.length > 0 ? series : []);
  const visibleSeries = allSeries;
  const featureSeries = visibleSeries.filter((item) => item.backdropUrl || item.posterUrl).slice(0, 8);
  const featuredSerie = featureSeries[featureIndex % Math.max(featureSeries.length, 1)] ?? visibleSeries[0];
  const topSeries = visibleSeries
    .filter((item) => item.posterUrl)
    .slice(0, 10)
    .map((item) => [item.titulo, item.genero?.split('|')[0]?.split(',')[0] || 'Serie', formatYearLabel(item.año || item.titulo), item]);
  const goPrevFeature = () =>
    setFeatureIndex((current) => (current - 1 + Math.max(featureSeries.length, 1)) % Math.max(featureSeries.length, 1));
  const goNextFeature = () => setFeatureIndex((current) => (current + 1) % Math.max(featureSeries.length, 1));

  useEffect(() => {
    if (featureSeries.length < 2) return undefined;
    const timer = window.setInterval(goNextFeature, 7000);
    return () => window.clearInterval(timer);
  }, [featureSeries.length]);

  return (
    <section className="catalog-page series-page">
      <div
        className="movies-feature series-feature"
        onClick={() => featuredSerie?.id && navigate(`/detail/serie/${featuredSerie.id}`)}
      >
        {featuredSerie && <img src={featuredSerie.backdropUrl || featuredSerie.posterUrl} alt="" />}
        <div className="movies-feature-overlay" />
        <div className="movies-feature-content series-feature-content">
          <h1>{featuredSerie?.titulo || 'Series'}</h1>
          <div className="movie-mini-meta">
            {featuredSerie?.año && <span>{featuredSerie.año}</span>}
            {featuredSerie?.totalSeasons && <span>{featuredSerie.totalSeasons} temp.</span>}
            {featuredSerie?.totalEpisodes && <span>{featuredSerie.totalEpisodes} eps.</span>}
          </div>
          {featuredSerie?.sinopsis && <p>{featuredSerie.sinopsis}</p>}
          {featureSeries.length > 1 && (
            <div className="hero-dots movies-dots">
              {featureSeries.map((item, index) => (
                <button
                  key={item.id || item.titulo}
                  className={index === featureIndex % Math.max(featureSeries.length, 1) ? 'active' : ''}
                  aria-label={item.titulo}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFeatureIndex(index);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {featureSeries.length > 1 && (
          <>
            <button
              className="hero-arrow hero-arrow-left series-arrow"
              onClick={(event) => {
                event.stopPropagation();
                goPrevFeature();
              }}
              aria-label="Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="hero-arrow hero-arrow-right series-arrow"
              onClick={(event) => {
                event.stopPropagation();
                goNextFeature();
              }}
              aria-label="Siguiente"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      <div className="movies-topten series-topten">
        <Rail row={{ title: 'Top 10 Series en M@umora', variant: 'top', items: topSeries }} navigate={navigate} />
      </div>

      <div className="series-grid-heading">
        <h2>Series</h2>
        <span>{visibleSeries.length.toLocaleString('es')} titulos</span>
      </div>

      <div className="movies-grid-wrap series-grid-wrap">
        <div className="movies-grid series-grid">
          {visibleSeries.map((item) => (
            <a
              className="movie-grid-card"
              href={item.detailUrl || `/detail/serie/${item.id}`}
              key={item.id}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.detailUrl || `/detail/serie/${item.id}`);
              }}
            >
              <span className="hover-info">
                <strong>{item.titulo}</strong>
                <small>
                  {[item.genero?.split('|')[0]?.split(',')[0], item.año || `${item.totalSeasons || 1} temp.`]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </span>
              <div className="movie-grid-poster">
                <img src={item.posterUrl} alt="" loading="lazy" />
                <RatingBadge item={item} category="serie" contentStats={contentStats} />
                <span className="grid-play" aria-label={`Ver ${item.titulo}`}>
                  <Play size={18} fill="currentColor" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
function AnimeScreen({ anime, navigate, contentStats }) {
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState(YEAR_LABEL);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const genres = ['Todos', 'Animacion', 'Accion', 'Aventura', 'Drama', 'Comedia', 'Misterio', 'Fantasia'];
  const years = [YEAR_LABEL, '2026', '2025', '2024', '2023', '2022', '2021', '2020'];
  const allAnime = sortCatalogByYearDesc(anime.length > 0 ? anime : []);
  const filteredAnime =
    selectedGenre === 'Todos' && selectedYear === YEAR_LABEL
      ? allAnime
      : allAnime.filter((item) => {
          const genreMatch =
            selectedGenre === 'Todos' || normalizeText(item.genero || '').includes(normalizeText(selectedGenre));
          const yearMatch = selectedYear === YEAR_LABEL || item.año === selectedYear;
          return genreMatch && yearMatch;
        });
  const visibleAnime = filteredAnime.length > 0 ? filteredAnime : allAnime;
  const featuredAnime = visibleAnime.find((item) => item.backdropUrl) ?? visibleAnime[0];
  const topAnime = visibleAnime
    .filter((item) => item.posterUrl)
    .slice(0, 10)
    .map((item) => [item.titulo, item.genero?.split('|')[0]?.split(',')[0] || 'Anime', formatYearLabel(item.año || item.titulo), item]);

  return (
    <section className="catalog-page">
      <div className="movies-feature anime-feature">
        {featuredAnime && <img src={featuredAnime.backdropUrl || featuredAnime.posterUrl} alt="" />}
        <div className="movies-feature-overlay" />
        <div className="movies-feature-content">
          <h1>{featuredAnime?.titulo || 'Anime'}</h1>
          <div className="movie-mini-meta">
            {featuredAnime?.año && <span>{featuredAnime.año}</span>}
            {featuredAnime?.totalSeasons && <span>{featuredAnime.totalSeasons} temp.</span>}
            {featuredAnime?.totalEpisodes && <span>{featuredAnime.totalEpisodes} eps.</span>}
          </div>
          {featuredAnime?.sinopsis && <p>{featuredAnime.sinopsis}</p>}
        </div>
      </div>

      <div className="movies-topten">
        <Rail row={{ title: 'Top 10 Anime', variant: 'top', items: topAnime }} navigate={navigate} />
      </div>

      <div className="catalog-controls">
        <div className="genre-chips">
          {genres.map((genre) => (
            <button
              className={selectedGenre === genre ? 'selected' : ''}
              key={genre}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
        <label className="year-filter">
          <span>{YEAR_LABEL}</span>
          <select
            className="year-select"
            aria-label="Filtrar por año"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </label>
        <button className="filter-button" onClick={() => setFiltersOpen((value) => !value)}>
          <Filter size={17} />
          Filtros
        </button>
      </div>

      {filtersOpen && (
        <div className="filters-panel">
          <div>
            <span>Genero</span>
            <div className="filter-grid">
              {genres.map((genre) => (
                <button
                  className={selectedGenre === genre ? 'selected' : ''}
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span>{YEAR_LABEL}</span>
            <div className="filter-grid year-grid">
              {years.map((year) => (
                <button
                  className={selectedYear === year ? 'selected' : ''}
                  key={year}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          <button
            className="clear-filters"
            onClick={() => {
              setSelectedGenre('Todos');
              setSelectedYear(YEAR_LABEL);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="movie-count">{visibleAnime.length.toLocaleString('es')} titulos</div>

      <div className="movies-grid-wrap">
        <div className="movies-grid">
          {visibleAnime.map((item) => (
            <a
              className="movie-grid-card"
              href={item.detailUrl || `/detail/anime/${item.id}`}
              key={item.id}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.detailUrl || `/detail/anime/${item.id}`);
              }}
            >
              <span className="hover-info">
                <strong>{item.titulo}</strong>
                <small>
                  {[item.genero?.split('|')[0]?.split(',')[0], item.año || `${item.totalSeasons || 1} temp.`]
                    .filter(Boolean)
                    .join(' - ')}
                </small>
              </span>
              <div className="movie-grid-poster">
                <img src={item.posterUrl} alt="" loading="lazy" />
                <RatingBadge item={item} category="anime" contentStats={contentStats} />
                <span className="grid-play" aria-label={`Ver ${item.titulo}`}>
                  <Play size={18} fill="currentColor" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function normalizeText(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isNativeAppRuntime() {
  const capacitor = window.Capacitor;
  if (!capacitor) return false;
  if (typeof capacitor.isNativePlatform === 'function') return capacitor.isNativePlatform();
  return ['ios', 'android'].includes(capacitor.getPlatform?.());
}

async function loadCatalogResource({ localPath, endpoint, normalize, transform = (items) => items, onLocal, onLive }) {
  try {
    const localData = await fetchJsonOrNull(localPath);
    const localItems = Array.isArray(localData?.items) ? localData.items : [];
    if (localItems.length) onLocal(transform(localItems));
  } catch {
    onLocal([]);
  }

  if (endpoint) {
    try {
      const liveItems = await fetchLivePagedCatalog(endpoint, normalize);
      if (liveItems.length) onLive(transform(liveItems));
    } catch {
      // Si la API en vivo no responde, se conserva el respaldo local.
    }
  }
}

async function loadHomeResource(setHomeData) {
  try {
    const localData = await fetchJsonOrNull('/data/home.json');
    if (localData) setHomeData(localData);
  } catch {
    setHomeData(null);
  }

  if (LIVE_CATALOG_ENDPOINTS.home) {
    try {
      const liveData = await fetchLiveJson(LIVE_CATALOG_ENDPOINTS.home);
      if (liveData && typeof liveData === 'object') setHomeData(liveData);
    } catch {
      // El home local queda como respaldo.
    }
  }
}

async function fetchJsonOrNull(path) {
  const response = await fetch(path);
  return response.ok ? response.json() : null;
}

async function fetchLiveJson(endpoint) {
  const url = endpoint;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`No se pudo leer ${url}`);
  return response.json();
}

async function fetchLivePagedCatalog(endpoint, normalize) {
  const items = [];
  let offset = 0;
  let total = null;

  while (total === null || offset < total) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const data = await fetchLiveJson(`${endpoint}${separator}limit=${LIVE_CATALOG_PAGE_SIZE}&offset=${offset}`);
    const pageItems = extractLiveItems(data);
    total = Number(data?.total ?? pageItems.length);
    items.push(...pageItems.map(normalize));
    if (pageItems.length === 0) break;
    offset += LIVE_CATALOG_PAGE_SIZE;
  }

  return items;
}

function pickValue(item, keys, fallback = null) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function pickLiveImage(item, keys) {
  const value = pickValue(item, keys);
  if (typeof value === 'string') return value;
  return pickValue(value || {}, ['url', 'src', 'path'], '');
}

function extractLiveItems(data) {
  if (Array.isArray(data)) return data;
  return pickValue(data, ['items', 'results', 'data', 'movies', 'series', 'anime', 'contents'], []);
}

function normalizeLiveYear(value) {
  const match = String(value || '').match(/\d{4}/);
  return match ? match[0] : '';
}

function normalizeLiveGenre(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => (typeof entry === 'string' ? entry : entry?.name)).filter(Boolean).join(', ');
  }
  return value || '';
}

function normalizeLiveMovie(item) {
  const id = String(pickValue(item, ['id', '_id', 'tmdbId', 'movieId', 'slug', 'contentId'], crypto.randomUUID?.() || Date.now()));
  const urlReproduccion = pickValue(item, [
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
    titulo: pickValue(item, ['titulo', 'title', 'name', 'nombre'], titleFromId(id)),
    sinopsis: pickValue(item, ['sinopsis', 'overview', 'description', 'plot', 'descripcion'], ''),
    posterUrl: pickLiveImage(item, ['posterUrl', 'poster', 'poster_path', 'image', 'cover', 'thumbnail']),
    backdropUrl: pickLiveImage(item, ['backdropUrl', 'backdrop', 'backdrop_path', 'background', 'fanart']),
    logoUrl: pickLiveImage(item, ['logoUrl', 'logo']),
    urlReproduccion,
    youtubeTrailer: pickValue(item, ['youtubeTrailer', 'trailer', 'trailerUrl'], ''),
    genero: normalizeLiveGenre(pickValue(item, ['genero', 'genre', 'genres', 'category'])),
    año: normalizeLiveYear(pickValue(item, ['año', 'year', 'releaseYear', 'release_date', 'releaseDate', 'date'])),
    actores: normalizeLiveGenre(pickValue(item, ['actores', 'cast', 'actors'])),
    vistas: pickValue(item, ['vistas', 'views'], '0'),
    esVip: Boolean(pickValue(item, ['esVip', 'vip', 'premium'], false)),
    tipo: 'pelicula',
    status: pickValue(item, ['status', 'visible'], 'visible'),
    valoracion: pickValue(item, ['valoracion', 'rating', 'vote_average'], ''),
    idioma: pickValue(item, ['idioma', 'language', 'audio', 'audioLanguage', 'lang'], ''),
    subtitulos: pickValue(item, ['subtitulos', 'subtitles', 'subtitleLanguage', 'captionLanguage'], ''),
    categoria: 'movie',
    detailUrl: `/detail/movie/${id}`,
    watchUrl: `/watch/movie/${id}`,
  };
}

function normalizeLiveEpisode(item) {
  return {
    serieId: pickValue(item, ['serieId', 'seriesId', 'showId']),
    temporada: Number(pickValue(item, ['temporada', 'season', 'seasonNumber'], 1)),
    episodio: Number(pickValue(item, ['episodio', 'episode', 'episodeNumber'], 1)),
    tituloEpisodio: pickValue(item, ['tituloEpisodio', 'title', 'name'], ''),
    urlReproduccion: pickValue(item, ['urlReproduccion', 'streamUrl', 'stream_url', 'playbackUrl', 'videoUrl', 'embedUrl', 'url']),
    urlReproduccion2: pickValue(item, ['urlReproduccion2', 'backupUrl', 'backup_url']),
  };
}

function normalizeLiveShow(item, category) {
  const id = String(pickValue(item, ['id', '_id', 'tmdbId', 'seriesId', 'showId', 'slug', 'contentId'], crypto.randomUUID?.() || Date.now()));
  const episodes = extractLiveItems(pickValue(item, ['episodes', 'episodios'], []))
    .map(normalizeLiveEpisode)
    .filter((episode) => episode.urlReproduccion || episode.urlReproduccion2);

  return {
    id,
    titulo: pickValue(item, ['titulo', 'title', 'name', 'nombre'], titleFromId(id)),
    sinopsis: pickValue(item, ['sinopsis', 'overview', 'description', 'plot', 'descripcion'], ''),
    posterUrl: pickLiveImage(item, ['posterUrl', 'poster', 'poster_path', 'image', 'cover', 'thumbnail']),
    backdropUrl: pickLiveImage(item, ['backdropUrl', 'backdrop', 'backdrop_path', 'background', 'fanart']),
    logoUrl: pickLiveImage(item, ['logoUrl', 'logo']),
    youtubeTrailer: pickValue(item, ['youtubeTrailer', 'trailer', 'trailerUrl'], ''),
    genero: normalizeLiveGenre(pickValue(item, ['genero', 'genre', 'genres', 'category'])),
    año: normalizeLiveYear(pickValue(item, ['año', 'year', 'first_air_date', 'release_date', 'date'])),
    visible: pickValue(item, ['visible', 'status'], true),
    totalSeasons: Number(pickValue(item, ['totalSeasons', 'seasonsCount', 'temporadas'], 1)),
    totalEpisodes: Number(pickValue(item, ['totalEpisodes', 'episodesCount', 'episodios'], episodes.length)),
    seasons: Array.isArray(item.seasons) ? item.seasons : [],
    episodes,
    categoria: category,
    detailUrl: `/detail/${category}/${id}`,
  };
}

function extractYear(value) {
  const match = String(value || '').match(/\b(19\d{2}|20\d{2})\b/);
  return match ? Number(match[0]) : 0;
}

function catalogYearRank(item) {
  return extractYear(item?.año || item?.year || item?.releaseYear || item?.titulo || item?.title);
}

function formatYearLabel(value) {
  const year = String(value || '').match(/\d{4}/)?.[0] || '';
  return year ? `${YEAR_LABEL} ${year}` : '';
}

function formatGenreYear(genre, year) {
  return [genre, formatYearLabel(year)].filter(Boolean).join(' - ');
}

function sortCatalogByYearDesc(items) {
  return [...items].sort((left, right) => {
    const yearDiff = catalogYearRank(right) - catalogYearRank(left);
    if (yearDiff !== 0) return yearDiff;
    return String(left.titulo || left.title || '').localeCompare(String(right.titulo || right.title || ''), 'es');
  });
}

function ContentRating({ rating = 0, onRate }) {
  const value = Number(rating) || 0;

  return (
    <div className="content-rating" aria-label="Calificacion de usuario">
      <span>Tu calificacion</span>
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            className={star <= value ? 'active' : ''}
            onClick={() => onRate?.(star)}
            aria-label={`Calificar con ${star} estrellas`}
          >
            <Star size={22} fill={star <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <strong>{value ? `${value}/5` : 'Sin calificar'}</strong>
    </div>
  );
}

function RatingBadge({ item, category = 'movie', contentStats }) {
  const rating = getContentRating(item, category, contentStats);

  return (
    <span className="rating-badge">
      <Star size={14} fill="currentColor" />
      {rating.toFixed(1)}
    </span>
  );
}

function getContentRating(item, category = 'movie', contentStats = {}) {
  if (!item) return 0;
  const stat = contentStats?.[`${getCatalogPath(category || item.categoria)}:${item.id}`];
  const ratingCount = Number(stat?.ratingCount || 0);
  const ratingSum = Number(stat?.ratingSum || 0);
  if (ratingCount > 0) return ratingSum / ratingCount;
  const catalogRating = Number(item.valoracion || item.rating || item.vote_average || 0);
  return Number.isFinite(catalogRating) ? catalogRating : 0;
}

function RatingPrompt({ title, rating = 0, onRate, onClose, onBack }) {
  return (
    <div className="rating-prompt" role="dialog" aria-modal="true" aria-label="Calificar contenido">
      <div className="rating-prompt-panel">
        <button className="rating-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <span>Finalizaste</span>
        <h2>{title}</h2>
        <ContentRating rating={rating} onRate={onRate} />
        <div className="rating-actions">
          <button className="primary-action" onClick={onBack}>
            Volver al detalle
          </button>
          <button className="secondary-action" onClick={onClose}>
            Seguir mirando
          </button>
        </div>
      </div>
    </div>
  );
}

function MovieDetail({ movie, isLoading, navigate, toggleFavorite }) {
  if (isLoading) {
    return (
      <section className="detail-page empty-detail">
        <div className="detail-loader" />
      </section>
    );
  }

  if (!movie) {
    return (
      <section className="detail-page empty-detail">
        <h1>No se encontro la pelicula</h1>
        <button onClick={() => navigate('/movies')}>Volver a peliculas</button>
      </section>
    );
  }

  return (
    <section className="detail-page">
      <img className="detail-backdrop" src={movie.backdropUrl || movie.posterUrl} alt="" />
      <div className="detail-overlay" />
      <div className="detail-content">
        <img className="detail-poster" src={movie.posterUrl} alt="" />
        <div className="detail-info">
          <p className="eyebrow">Pelicula</p>
          <h1>{movie.titulo}</h1>
          <div className="hero-meta">
            {movie.valoracion && <span>{Number(movie.valoracion).toFixed(1)}</span>}
            {movie.año && <span>{formatYearLabel(movie.año)}</span>}
            {movie.genero && <span>{movie.genero.split(',').slice(0, 2).join(', ')}</span>}
          </div>
          {movie.sinopsis && <p className="detail-copy">{movie.sinopsis}</p>}
          {movie.actores && <p className="detail-cast">Reparto: {movie.actores}</p>}
          <div className="hero-actions">
            <button className="primary-action" onClick={() => navigate(`/watch/movie/${movie.id}`)}>
              <Play size={19} fill="currentColor" />
              Ver ahora
            </button>
            <button className="secondary-action" onClick={() => navigate('/movies')}>
              Volver
            </button>
            <button className="icon-action" aria-label="Agregar a Mi Lista" onClick={() => toggleFavorite?.(movie)}>
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeriesDetail({
  serie,
  isLoading,
  navigate,
  typeLabel = 'Serie',
  backPath = '/series',
}) {
  if (isLoading) {
    return (
      <section className="detail-page empty-detail">
        <div className="detail-loader" />
      </section>
    );
  }

  if (!serie) {
    return (
      <section className="detail-page empty-detail">
        <h1>No se encontro la serie</h1>
        <button onClick={() => navigate(backPath)}>Volver</button>
      </section>
    );
  }

  return (
    <section className="detail-page">
      <img className="detail-backdrop" src={serie.backdropUrl || serie.posterUrl} alt="" />
      <div className="detail-overlay" />
      <div className="detail-content">
        <img className="detail-poster" src={serie.posterUrl} alt="" />
        <div className="detail-info">
          <p className="eyebrow">{typeLabel}</p>
          <h1>{serie.titulo}</h1>
          <div className="hero-meta">
            {serie.año && <span>{serie.año}</span>}
            {serie.totalSeasons && <span>{serie.totalSeasons} temp.</span>}
            {serie.totalEpisodes && <span>{serie.totalEpisodes} eps.</span>}
          </div>
          {serie.sinopsis && <p className="detail-copy">{serie.sinopsis}</p>}
          <div className="hero-actions">
            <button
              className="primary-action"
              onClick={() => {
                const category = serie.categoria === 'anime' ? 'anime' : 'serie';
                const firstEpisode = getFirstPlayableEpisode(serie);
                navigate(
                  firstEpisode
                    ? `/watch/${category}/${serie.id}/${firstEpisode.temporada}/${firstEpisode.episodio}`
                    : `/episodes/${category}/${serie.id}`,
                );
              }}
            >
              <Play size={19} fill="currentColor" />
              Episodios
            </button>
            <button className="secondary-action" onClick={() => navigate(backPath)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EpisodesScreen({ serie, isLoading, navigate, type = 'serie', backPath }) {
  if (isLoading) {
    return (
      <section className="episodes-page">
        <div className="detail-loader" />
      </section>
    );
  }

  if (!serie) {
    return (
      <section className="episodes-page episodes-empty">
        <h1>No se encontro la serie</h1>
        <button onClick={() => navigate(type === 'anime' ? '/anime' : '/series')}>Volver</button>
      </section>
    );
  }

  const seasons = buildEpisodeSeasons(serie);
  const label = type === 'anime' ? 'Anime' : 'Serie';

  return (
    <section className="episodes-page">
      <img className="episodes-backdrop" src={serie.backdropUrl || serie.posterUrl} alt="" />
      <div className="episodes-overlay" />
      <div className="episodes-content">
        <button className="secondary-action episodes-back" onClick={() => navigate(backPath)}>
          <ChevronLeft size={19} />
          Volver
        </button>
        <div className="episodes-heading">
          <img src={serie.posterUrl} alt="" />
          <div>
            <p className="eyebrow">{label}</p>
            <h1>{serie.titulo}</h1>
            <div className="hero-meta">
              {serie.totalSeasons && <span>{serie.totalSeasons} temp.</span>}
              {serie.totalEpisodes && <span>{serie.totalEpisodes} eps.</span>}
            </div>
          </div>
        </div>

        <div className="season-list">
          {seasons.map((season) => (
            <section className="season-block" key={season.number}>
              <h2>Temporada {season.number}</h2>
              <div className="episode-grid">
                {season.episodes.map((episode) => (
                  <button
                    className="episode-card"
                    key={`${season.number}-${episode.number}`}
                    type="button"
                    disabled={!getEpisodePlaybackUrl(episode)}
                    onClick={() => navigate(`/watch/${type}/${serie.id}/${episode.temporada}/${episode.episodio}`)}
                  >
                    <span>Episodio {episode.number}</span>
                    <small>{episode.tituloEpisodio || (getEpisodePlaybackUrl(episode) ? 'Ver ahora' : 'Enlace no disponible')}</small>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildEpisodeSeasons(serie) {
  if (Array.isArray(serie.episodes) && serie.episodes.length > 0) {
    const groups = new Map();
    serie.episodes.forEach((episode) => {
      const seasonNumber = Number(episode.temporada) || 1;
      if (!groups.has(seasonNumber)) groups.set(seasonNumber, []);
      groups.get(seasonNumber).push({
        ...episode,
        number: Number(episode.episodio) || groups.get(seasonNumber).length + 1,
      });
    });

    return Array.from(groups.entries())
      .sort(([left], [right]) => left - right)
      .map(([number, episodes]) => ({
        number,
        episodes: episodes.sort((left, right) => left.number - right.number),
      }));
  }

  const seasonCount = Math.max(Number(serie.totalSeasons) || 1, 1);
  const episodeCount = Math.max(Number(serie.totalEpisodes) || seasonCount, seasonCount);
  const baseEpisodes = Math.floor(episodeCount / seasonCount);
  const extraEpisodes = episodeCount % seasonCount;
  let current = 1;

  return Array.from({ length: seasonCount }, (_, index) => {
    const count = baseEpisodes + (index < extraEpisodes ? 1 : 0);
    const episodes = Array.from({ length: count }, (_, episodeIndex) => ({
      number: episodeIndex + 1,
      globalNumber: current++,
      temporada: String(index + 1),
      episodio: String(episodeIndex + 1),
    }));

    return {
      number: index + 1,
      episodes,
    };
  });
}

function findEpisodeFromPath(items, path) {
  const [, , , serieId, season, episode] = path.split('/');
  const serie = items.find((item) => item.id === serieId);
  if (!serie || !Array.isArray(serie.episodes)) return null;
  return serie.episodes.find(
    (item) => String(item.temporada) === String(season) && String(item.episodio) === String(episode),
  );
}

function getEpisodePlaybackUrl(episode) {
  return episode?.urlReproduccion || episode?.urlReproduccion2 || null;
}

function getFirstPlayableEpisode(serie) {
  if (!Array.isArray(serie?.episodes)) return null;
  return [...serie.episodes]
    .sort((left, right) => {
      const leftSeason = Number(left.temporada) || 1;
      const rightSeason = Number(right.temporada) || 1;
      if (leftSeason !== rightSeason) return leftSeason - rightSeason;
      return (Number(left.episodio) || 1) - (Number(right.episodio) || 1);
    })
    .find((episode) => getEpisodePlaybackUrl(episode));
}

function EpisodeWatchScreen({
  serie,
  episode,
  isLoading,
  navigate,
  type = 'serie',
  rating = 0,
  onRate,
  onViewed,
}) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const viewedRef = useRef(false);

  const finishWatching = () => {
    if (!viewedRef.current) {
      onViewed?.();
      viewedRef.current = true;
    }
    setRatingOpen(true);
  };

  if (isLoading) {
    return (
      <section className="watch-page">
        <div className="detail-loader" />
      </section>
    );
  }

  const detailPath = `/detail/${type}/${serie?.id || ''}`;

  if (!serie || !episode) {
    return (
      <section className="watch-page watch-empty">
        <h1>No se encontro el episodio</h1>
        <button onClick={() => navigate(type === 'anime' ? '/anime' : '/series')}>Volver</button>
      </section>
    );
  }

  const playbackUrl = getEpisodePlaybackUrl(episode);
  const localizedPlaybackUrl = playbackUrl ? withSpanishPlayerLocale(playbackUrl) : null;
  const title = episode.tituloEpisodio || `${serie.titulo} T${episode.temporada} E${episode.episodio}`;
  const allEpisodes = buildEpisodeSeasons(serie).flatMap((season) => season.episodes);

  return (
    <section className="watch-page">
      {playbackUrl && isDirectMediaUrl(playbackUrl) ? (
        <MoviePlayer poster={serie.backdropUrl || serie.posterUrl} src={playbackUrl} title={title} kind={type} onEnded={finishWatching} />
      ) : localizedPlaybackUrl ? (
        <iframe
          className="watch-frame"
          src={localizedPlaybackUrl}
          title={title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          lang="es"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="watch-unavailable">
          <img src={serie.backdropUrl || serie.posterUrl} alt="" />
          <div>
            <h1>{title}</h1>
            <p>Este episodio no tiene enlace de reproduccion disponible.</p>
            <button onClick={() => navigate(detailPath)}>Volver al detalle</button>
          </div>
        </div>
      )}
      <button className="finish-watch-button" onClick={finishWatching}>
        Finalizar y calificar
      </button>
      <PlayerChrome
        backLabel={serie.titulo}
        currentEpisode={episode}
        episodes={allEpisodes}
        isExternalPlayer={!!localizedPlaybackUrl && !isDirectMediaUrl(playbackUrl)}
        navigate={navigate}
        onBack={() => navigate(detailPath)}
        title={title}
        type={type}
        serieId={serie.id}
      />
      {ratingOpen && (
        <RatingPrompt
          title={serie.titulo}
          rating={rating}
          onRate={onRate}
          onClose={() => setRatingOpen(false)}
          onBack={() => navigate(detailPath)}
        />
      )}
    </section>
  );
}

function PlayerChrome({
  backLabel,
  currentEpisode,
  episodes = [],
  isExternalPlayer = false,
  navigate,
  onBack,
  title,
  type,
  serieId,
}) {
  const currentKey = `${currentEpisode?.temporada || ''}-${currentEpisode?.episodio || ''}`;
  const playableEpisodes = episodes.filter((episode) => getEpisodePlaybackUrl(episode));
  const hasMultipleSeasons = new Set(playableEpisodes.map((episode) => String(episode.temporada || '1'))).size > 1;

  return (
    <div className={`player-chrome ${isExternalPlayer ? 'external-player-chrome' : ''}`}>
      <div className="player-top">
        <button className="player-back" onClick={onBack} aria-label="Volver">
          <ChevronLeft size={34} />
        </button>
        <div className="player-title">
          <span>Estas mirando</span>
          <strong>{backLabel || title}</strong>
        </div>
      </div>

      {!isExternalPlayer && (
        <>
          <div className="player-center-controls" aria-hidden="true">
            <button>
              <RotateCcw size={42} />
              <span>15</span>
            </button>
            <button className="player-play">
              <Play size={44} fill="currentColor" />
            </button>
            <button>
              <RotateCw size={42} />
              <span>15</span>
            </button>
          </div>

          <div className="player-side player-side-left" aria-hidden="true">
            <div className="player-vertical-fill" />
            <Settings size={25} />
          </div>

          <div className="player-side player-side-right" aria-hidden="true">
            <div className="player-volume">
              <span />
            </div>
            <small>100%</small>
            <Volume2 size={25} />
          </div>
        </>
      )}

      <div className="player-bottom">
        {playableEpisodes.length > 0 && (
          <div className="player-episode-strip">
            {playableEpisodes.map((episode) => {
              const selected = `${episode.temporada}-${episode.episodio}` === currentKey;
              return (
                <button
                  className={selected ? 'selected' : ''}
                  key={`${episode.temporada}-${episode.episodio}`}
                  onClick={() => navigate(`/watch/${type}/${serieId}/${episode.temporada}/${episode.episodio}`)}
                >
                  {hasMultipleSeasons ? `T${episode.temporada} E${episode.episodio}` : `E${episode.episodio}`}
                </button>
              );
            })}
          </div>
        )}
        {!isExternalPlayer && (
          <>
            <div className="player-progress-row">
              <span>8:04</span>
              <div className="player-progress">
                <span />
              </div>
              <span>23</span>
            </div>
            <div className="player-settings-row">
              <span>
                <Gauge size={17} />
                Velocidad
              </span>
              <span>Auto - 720p</span>
              <span>
                <Settings size={17} />
                Idioma
              </span>
              <span>
                <Captions size={17} />
                Subtitulos
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WatchScreen({ movie, isLoading, navigate, rating = 0, onRate, onViewed }) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const viewedRef = useRef(false);

  const finishWatching = () => {
    if (!viewedRef.current) {
      onViewed?.();
      viewedRef.current = true;
    }
    setRatingOpen(true);
  };

  useEffect(() => {
    if (!movie?.id) return undefined;
    const closeWithEscape = (event) => {
      if (event.key === 'Escape') navigate(`/detail/movie/${movie.id}`);
    };
    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, [movie?.id, navigate]);

  if (isLoading) {
    return (
      <section className="watch-page">
        <div className="detail-loader" />
      </section>
    );
  }

  if (!movie) {
    return (
      <section className="watch-page watch-empty">
        <h1>No se encontro la pelicula</h1>
        <button onClick={() => navigate('/movies')}>Volver a peliculas</button>
      </section>
    );
  }

  const trailerId = getYouTubeId(movie.youtubeTrailer);
  const playbackUrl = movie.urlReproduccion || null;
  const localizedPlaybackUrl = playbackUrl ? withSpanishPlayerLocale(playbackUrl) : null;
  const useInternalPlayer = isDirectMediaUrl(playbackUrl);
  const useExternalSource = Boolean(movie.externalPage);

  return (
    <section className="watch-page">
      <div className="watch-topbar">
        <button className="exit-watch-button" onClick={() => navigate(`/detail/movie/${movie.id}`)}>
          <X size={18} />
          Salir
        </button>
        <span>{movie.titulo}</span>
        <button className="finish-watch-link" onClick={finishWatching}>
          Finalizar y calificar
        </button>
      </div>

      {useExternalSource ? (
        <div className="watch-external-source">
          <img src={movie.backdropUrl || movie.posterUrl} alt="" />
          <div>
            <span>Fuente externa</span>
            <h1>{movie.titulo}</h1>
            <p>Esta pelicula viene desde una pagina externa. Ese reproductor no entrega un archivo directo para abrirlo dentro de M@umora sin fallar.</p>
            <a href={playbackUrl} target="_blank" rel="noreferrer">
              Abrir fuente
            </a>
          </div>
        </div>
      ) : useInternalPlayer ? (
        <MoviePlayer
          poster={movie.backdropUrl || movie.posterUrl}
          src={playbackUrl}
          title={movie.titulo}
          onEnded={finishWatching}
        />
      ) : localizedPlaybackUrl ? (
        <iframe
          className="watch-frame"
          src={localizedPlaybackUrl}
          title={movie.titulo}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          lang="es"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : trailerId ? (
        <iframe
          className="watch-frame"
          src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0&hl=es&cc_lang_pref=es`}
          title={movie.titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          lang="es"
          allowFullScreen
        />
      ) : (
        <div className="watch-unavailable">
          <img src={movie.backdropUrl || movie.posterUrl} alt="" />
          <div>
            <h1>{movie.titulo}</h1>
            <p>No hay trailer disponible para este titulo en la copia local.</p>
            <button onClick={() => navigate(`/detail/movie/${movie.id}`)}>Ver detalle</button>
          </div>
        </div>
      )}
      {ratingOpen && (
        <RatingPrompt
          title={movie.titulo}
          rating={rating}
          onRate={onRate}
          onClose={() => setRatingOpen(false)}
          onBack={() => navigate(`/detail/movie/${movie.id}`)}
        />
      )}
    </section>
  );
}

function MoviePlayer({ src, title, poster, onEnded, kind = 'movie' }) {
  const mediaRef = useRef(null);
  const playbackSources = useMemo(() => buildPlaybackCandidates(src, kind).map(proxiedArchiveHlsUrl), [src, kind]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const playbackSrc = playbackSources[sourceIndex] || playbackSources[0] || '';

  useEffect(() => {
    setSourceIndex(0);
  }, [src]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !playbackSrc) return undefined;
    let hls;
    let wakeLock;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        wakeLock = null;
      }
    };

    if (isHlsUrl(playbackSrc) && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          setSourceIndex((current) => (current + 1 < playbackSources.length ? current + 1 : current));
        }
      });
      hls.loadSource(playbackSrc);
      hls.attachMedia(media);
    } else if (isHlsUrl(playbackSrc) && media.canPlayType('application/vnd.apple.mpegurl')) {
      media.src = playbackSrc;
    } else {
      media.src = playbackSrc;
    }

    const handleError = () => {
      setSourceIndex((current) => (current + 1 < playbackSources.length ? current + 1 : current));
    };

    media.addEventListener('error', handleError);
    requestWakeLock();

    return () => {
      if (hls) hls.destroy();
      if (wakeLock) wakeLock.release().catch(() => {});
      media.removeEventListener('error', handleError);
      media.removeAttribute('src');
      media.load();
    };
  }, [playbackSrc, playbackSources.length]);

  return (
    <video
      className="movie-player"
      ref={mediaRef}
      title={title}
      poster={poster}
      controls
      playsInline
      autoPlay
      onEnded={onEnded}
    />
  );
}

function proxiedArchiveHlsUrl(value) {
  if (!value || !PRIVATE_TV_PROXY_URL) return value;
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith('archive.org') || !/\.m3u8(\?|#|$)/i.test(url.pathname)) return value;
    const proxyUrl = new URL('/stream', PRIVATE_TV_PROXY_URL);
    proxyUrl.searchParams.set('u', toBase64Url(url.toString()));
    proxyUrl.searchParams.set('kind', 'hls');
    return proxyUrl.toString();
  } catch {
    return value;
  }
}

function isDirectMediaUrl(value) {
  if (!value) return false;
  return isHlsUrl(value)
    || isWorkerStreamUrl(value)
    || isXtreamShortMediaUrl(value)
    || /\/(movie|series)\//i.test(value)
    || /\.(mp4|webm|ogv|ogg|mov|m4v|mkv|avi)(\?|#|$)/i.test(value);
}

function isXtreamShortMediaUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.length === 3 && !['live', 'movie', 'series'].includes(parts[0]);
  } catch {
    return false;
  }
}

function proxiedLiveStreamUrl(value) {
  if (!value) return value;
  if (IS_NATIVE_APP) return value;
  try {
    const url = new URL(value);
    const activeProxy = WEB_STREAM_PROXY_URL || (PRIVATE_TV_PROXY_URL ? new URL('/stream', PRIVATE_TV_PROXY_URL).toString() : '');
    if (!activeProxy) return value;
    const activeProxyUrl = new URL(activeProxy, window.location.origin);
    if (url.origin === activeProxyUrl.origin && url.pathname === activeProxyUrl.pathname) return value;
    if (url.protocol !== 'http:') return value;
    const proxyUrl = new URL(activeProxyUrl.toString());
    proxyUrl.searchParams.set('u', toBase64Url(url.toString()));
    if (isHlsUrl(url.toString()) || /\/live\/[^/]+\/[^/]+\/[^/]+/i.test(url.pathname)) {
      proxyUrl.searchParams.set('kind', 'hls');
    }
    return proxyUrl.toString();
  } catch {
    return value;
  }
}

function proxiedM3uListUrl(value) {
  if (!value || IS_NATIVE_APP) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:') return value;
    return proxiedLiveStreamUrl(value);
  } catch {
    return value;
  }
}

function buildPlaybackCandidates(value, kind = 'movie') {
  const candidates = [];
  const add = (candidate) => {
    if (candidate && /^https?:\/\//i.test(candidate) && !candidates.includes(candidate)) candidates.push(candidate);
  };

  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 3 && !['live', 'movie', 'series'].includes(parts[0])) {
      const [user, pass, id] = parts;
      if (kind === 'tv' || kind === 'radio') {
        add(`${url.origin}/live/${user}/${pass}/${id}.m3u8`);
        add(`${url.origin}/live/${user}/${pass}/${id}.ts`);
        return candidates;
      } else if (kind === 'series' || kind === 'anime') {
        add(`${url.origin}/series/${user}/${pass}/${id}.mp4`);
        add(`${url.origin}/movie/${user}/${pass}/${id}.mp4`);
      } else {
        add(`${url.origin}/movie/${user}/${pass}/${id}.mp4`);
        add(`${url.origin}/series/${user}/${pass}/${id}.mp4`);
      }
      add(value);
      return candidates;
    }

    if (parts.length === 4 && ['live', 'movie', 'series'].includes(parts[0])) {
      const [prefix, user, pass, idWithExt] = parts;
      const id = idWithExt.replace(/\.[^.]+$/, '');
      if (prefix === 'live') {
        add(`${url.origin}/live/${user}/${pass}/${id}.m3u8`);
        add(`${url.origin}/live/${user}/${pass}/${id}.ts`);
        return candidates;
      }
      if (prefix === 'movie') add(`${url.origin}/movie/${user}/${pass}/${id}.mp4`);
      if (prefix === 'series') add(`${url.origin}/series/${user}/${pass}/${id}.mp4`);
    }
  } catch {
    // Si no se puede normalizar, se usa solo el enlace original.
  }

  add(value);
  return candidates;
}

function isHlsUrl(value) {
  if (/\.m3u8(\?|#|$)/i.test(value || '')) return true;
  try {
    const url = new URL(value);
    return isWorkerStreamUrl(value) && url.searchParams.get('kind') === 'hls';
  } catch {
    return false;
  }
}

function isWorkerStreamUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname.endsWith('.workers.dev') && url.pathname === '/stream';
  } catch {
    return false;
  }
}

function proxiedImageUrl(value) {
  if (!value) return '';
  if (!PRIVATE_TV_PROXY_URL) return value;

  try {
    const sourceUrl = new URL(value);
    if (sourceUrl.protocol !== 'http:') return value;
    const proxyUrl = new URL('/asset', PRIVATE_TV_PROXY_URL);
    proxyUrl.searchParams.set('u', toBase64Url(sourceUrl.toString()));
    return proxyUrl.toString();
  } catch {
    return value;
  }
}

function toBase64Url(value) {
  try {
    return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  } catch {
    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
}

function withSpanishPlayerLocale(value) {
  try {
    const url = new URL(value);
    url.searchParams.set('lang', 'es');
    url.searchParams.set('locale', 'es_ES');
    url.searchParams.set('hl', 'es');
    url.searchParams.set('language', 'es');
    return url.toString();
  } catch {
    const separator = value.includes('?') ? '&' : '?';
    return `${value}${separator}lang=es&locale=es_ES&hl=es&language=es`;
  }
}

function MyListScreen({ favorites, navigate, toggleFavorite }) {
  return (
    <section className="mylist-page">
      <header className="mylist-header">
        <p className="eyebrow">M@umora</p>
        <h1>Mi Lista</h1>
        <p>{favorites.length} titulos guardados</p>
      </header>

      {favorites.length === 0 ? (
        <div className="mylist-empty">
          <Heart size={44} />
          <h2>No hay titulos guardados</h2>
          <p>Agrega peliculas, series o anime desde el detalle para encontrarlos aqui.</p>
          <button onClick={() => navigate('/home')}>Explorar</button>
        </div>
      ) : (
        <div className="movies-grid-wrap">
          <div className="movies-grid">
            {favorites.map((item) => (
              <article className="movie-grid-card saved-card" key={`${item.categoria}-${item.id}`}>
                <button className="remove-saved" onClick={() => toggleFavorite(item)} aria-label="Quitar de Mi Lista">
                  <X size={16} />
                </button>
                <a
                  href={item.detailUrl}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(item.detailUrl);
                  }}
                >
                  <span className="hover-info">
                    <strong>{item.titulo}</strong>
                    <small>{formatGenreYear(item.genero?.split(',')[0], item.año)}</small>
                  </span>
                  <div className="movie-grid-poster">
                    <img src={item.posterUrl} alt="" loading="lazy" />
                    <span className="grid-play" aria-label={`Ver ${item.titulo}`}>
                      <Play size={18} fill="currentColor" />
                    </span>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function TvLiveScreen({ mode = 'tv', tvData = [], channelFavorites = [], toggleChannelFavorite }) {
  const isRadioMode = mode === 'radio';
  const [availableSources, setAvailableSources] = useState(() => buildInitialTvSources());
  const [sourceIndex, setSourceIndex] = useState(0);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Cargando lista...');
  const [showListForm, setShowListForm] = useState(false);
  const [customListName, setCustomListName] = useState('');
  const [customListText, setCustomListText] = useState('');
  const [customListError, setCustomListError] = useState('');
  const [customListLoading, setCustomListLoading] = useState(false);
  const [customLists, setCustomLists] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CUSTOM_M3U_LISTS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const customSources = useMemo(() => customLists.map((list) => {
    const parsedChannels = parseM3u(list.text || '', list.name || 'Lista M3U')
      .filter((channel) => isValidChannelTitle(channel.name))
      .reduce(dedupeChannelsReducer, []);

    return {
      group: 'Listas agregadas',
      name: list.name || 'Lista M3U',
      url: `custom:${list.id}`,
      id: list.id,
      custom: true,
      channels: parsedChannels,
      error: parsedChannels.length ? '' : 'La lista no tiene canales compatibles.',
    };
  }), [customLists]);
  const visibleSources = useMemo(() => {
    const mappedSources = availableSources.map((source) => ({
      ...source,
      channels: (source.channels || []).filter((channel) => (
        isRadioMode
          ? isRadioChannel(channel, source)
          : !isRadioChannel(channel, source) && !isVodChannel(channel, source)
      )),
    }));
    const populatedSources = mappedSources.filter((source) => source.channels.length);
    if (populatedSources.length) return populatedSources;
    return mappedSources.filter((source) => (
      isRadioMode ? isLikelyRadioSource(source) : !isLikelyRadioSource(source)
    ));
  }, [availableSources, isRadioMode]);
  const selectedSource = visibleSources[sourceIndex] || visibleSources[0];
  const modeFavorites = useMemo(() => channelFavorites.filter((channel) => (channel.mode || 'tv') === mode), [channelFavorites, mode]);
  const favoriteIds = useMemo(() => new Set(modeFavorites.map((channel) => channel.id)), [modeFavorites]);
  const isSelectedFavorite = selectedChannel ? favoriteIds.has(getChannelFavoriteId(selectedChannel, mode)) : false;

  useEffect(() => {
    setSourceIndex(0);
    setQuery('');
    setSelectedCategory('Todos');
  }, [mode]);

  useEffect(() => {
    if (sourceIndex >= visibleSources.length) {
      setSourceIndex(0);
    }
  }, [sourceIndex, visibleSources.length]);

  useEffect(() => {
    const baseSources = tvData.length ? tvData : buildInitialTvSources();
    setAvailableSources([...baseSources, ...customSources]);
  }, [tvData, customSources]);

  const saveCustomLists = (nextLists) => {
    setCustomLists(nextLists);
    localStorage.setItem(CUSTOM_M3U_LISTS_KEY, JSON.stringify(nextLists));
  };

  const addCustomList = async () => {
    const nameValue = customListName.trim();
    const textValue = customListText.trim();
    const input = textValue || (/^https?:\/\//i.test(nameValue) ? nameValue : '');
    const name = /^https?:\/\//i.test(nameValue) ? `Lista M3U ${customLists.length + 1}` : nameValue || `Lista M3U ${customLists.length + 1}`;

    if (!input) {
      setCustomListError('Pega una URL M3U o el contenido completo de la lista.');
      return;
    }

    setCustomListLoading(true);
    setCustomListError('');

    let text = input;
    try {
      if (/^https?:\/\//i.test(input)) {
        const response = await fetch(proxiedM3uListUrl(input), {
          headers: { accept: 'application/x-mpegurl,text/plain,*/*' },
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        text = await response.text();
      }
    } catch {
      setCustomListLoading(false);
      setCustomListError('No se pudo cargar esa URL. Prueba pegando el contenido completo de la lista.');
      return;
    }

    const parsedChannels = parseM3u(text, name).filter((channel) => isValidChannelTitle(channel.name));

    if (!text.includes('#EXTM3U') || !parsedChannels.length) {
      setCustomListLoading(false);
      setCustomListError('La lista no tiene canales compatibles.');
      return;
    }

    const nextLists = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        text,
      },
      ...customLists,
    ].slice(0, 8);

    saveCustomLists(nextLists);
    setCustomListName('');
    setCustomListText('');
    setCustomListError('');
    setCustomListLoading(false);
    setShowListForm(false);
    setSourceIndex(0);
  };

  const removeCustomList = (id) => {
    saveCustomLists(customLists.filter((list) => list.id !== id));
    setSourceIndex(0);
  };

  useEffect(() => {
    let cancelled = false;
    setChannels([]);
    setSelectedChannel(null);
    setSelectedCategory('Todos');
    setStatus('Cargando lista...');

    const parsed = Array.isArray(selectedSource?.channels)
      ? selectedSource.channels.filter((channel) => isValidChannelTitle(channel.name)).reduce(dedupeChannelsReducer, [])
      : [];
    if (!cancelled) {
      setChannels(parsed);
      setSelectedChannel(parsed[0] || null);
      setStatus(parsed.length ? '' : selectedSource?.error || `La lista no tiene ${isRadioMode ? 'radios' : 'canales'} compatibles.`);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedSource, isRadioMode]);

  const categories = useMemo(() => {
    return [
      'Todos',
      ...(modeFavorites.length ? [FAVORITE_CHANNEL_CATEGORY] : []),
    ];
  }, [modeFavorites.length]);
  const filteredChannels = channels.filter((channel) => {
    const favoriteMatch = selectedCategory !== FAVORITE_CHANNEL_CATEGORY || favoriteIds.has(getChannelFavoriteId(channel, mode));
    const categoryMatch = selectedCategory === 'Todos' || selectedCategory === FAVORITE_CHANNEL_CATEGORY || channel.group === selectedCategory;
    const searchMatch = normalizeText(channel.name).includes(normalizeText(query));
    return favoriteMatch && categoryMatch && searchMatch;
  });

  return (
    <section className="tv-page">
      <div className="tv-hero">
        <div>
          <p className="eyebrow">{isRadioMode ? 'Radio en vivo' : 'TV en vivo'}</p>
          <h1>{isRadioMode ? 'Radio' : 'Television'}</h1>
          <p>{isRadioMode ? 'Emisoras separadas de las listas M3U para escuchar en directo.' : 'Canales de television separados de las emisoras de radio.'}</p>
        </div>
        <div className="tv-source-tools">
          <select
            className="tv-source-select"
            value={sourceIndex}
            onChange={(event) => setSourceIndex(Number(event.target.value))}
          >
            {visibleSources.map((source, index) => (
              <option key={source.url} value={index}>
                {source.name}
              </option>
            ))}
          </select>
          <button className="tv-add-list-button" type="button" onClick={() => setShowListForm((value) => !value)}>
            {showListForm ? <X size={18} /> : <Plus size={18} />}
            <span>{showListForm ? 'Cerrar' : 'Agregar lista'}</span>
          </button>
        </div>
      </div>

      {showListForm && (
        <div className="m3u-panel">
          <div className="m3u-fields">
            <input
              value={customListName}
              onChange={(event) => setCustomListName(event.target.value)}
              placeholder="Nombre de la lista opcional"
            />
            <textarea
              value={customListText}
              onChange={(event) => setCustomListText(event.target.value)}
              placeholder="Pega aqui una URL M3U o el contenido completo de la lista"
              rows={7}
            />
          </div>
          <div className="m3u-actions">
            <button type="button" onClick={addCustomList} disabled={customListLoading}>
              {customListLoading ? 'Cargando...' : 'Guardar lista'}
            </button>
            {customListError && <span>{customListError}</span>}
          </div>
          {customLists.length > 0 && (
            <div className="m3u-saved">
              {customLists.map((list) => (
                <button key={list.id} type="button" onClick={() => removeCustomList(list.id)}>
                  <X size={14} />
                  <span>{list.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="tv-layout">
        <div className="tv-player-panel">
          <LivePlayer channel={selectedChannel} mode={mode} />
          <div className="tv-now">
            <div>
              <span>{selectedSource?.group || (isRadioMode ? 'Radio en vivo' : 'TV en vivo')}</span>
              <h2>{selectedChannel?.name || `Selecciona ${isRadioMode ? 'una radio' : 'un canal'}`}</h2>
              <p>{selectedChannel?.group || selectedSource?.name || 'Lista no disponible'}</p>
            </div>
            <div className="tv-now-actions">
              {selectedChannel && (
                <button
                  className={`channel-favorite-button ${isSelectedFavorite ? 'saved' : ''}`}
                  type="button"
                  onClick={() => toggleChannelFavorite?.(selectedChannel, selectedSource, mode)}
                  aria-label={isSelectedFavorite ? 'Quitar canal de favoritos' : 'Guardar canal favorito'}
                  title={isSelectedFavorite ? 'Quitar de favoritos' : 'Guardar favorito'}
                >
                  <Heart size={18} fill={isSelectedFavorite ? 'currentColor' : 'none'} />
                </button>
              )}
              {selectedChannel?.logo && <img src={selectedChannel.logo} alt="" />}
            </div>
          </div>
        </div>

        <aside className="tv-sidebar">
          <div className="tv-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isRadioMode ? 'Buscar radio...' : 'Buscar canal...'} />
          </div>
          <div className="tv-categories">
            {categories.map((category) => (
              <button
                key={category}
                className={category === selectedCategory ? 'selected' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          {status ? (
            <div className="tv-status">{status}</div>
          ) : (
            <div className="tv-channel-list">
              {filteredChannels.map((channel) => (
                <article
                  key={`${channel.name}-${channel.url}`}
                  className={selectedChannel?.url === channel.url ? 'active' : ''}
                >
                  <button className="tv-channel-main" type="button" onClick={() => setSelectedChannel(channel)}>
                    {channel.logo ? <img src={channel.logo} alt="" /> : <span>{channel.name.slice(0, 1)}</span>}
                    <strong>{channel.name}</strong>
                    <small>{channel.group}</small>
                  </button>
                  <button
                    className={`tv-channel-favorite ${favoriteIds.has(getChannelFavoriteId(channel, mode)) ? 'saved' : ''}`}
                    type="button"
                    onClick={() => toggleChannelFavorite?.(channel, selectedSource, mode)}
                    aria-label={favoriteIds.has(getChannelFavoriteId(channel, mode)) ? 'Quitar canal de favoritos' : 'Guardar canal favorito'}
                    title={favoriteIds.has(getChannelFavoriteId(channel, mode)) ? 'Quitar de favoritos' : 'Guardar favorito'}
                  >
                    <Heart size={16} fill={favoriteIds.has(getChannelFavoriteId(channel, mode)) ? 'currentColor' : 'none'} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function LivePlayer({ channel, mode = 'tv' }) {
  const mediaRef = useRef(null);
  const [playerStatus, setPlayerStatus] = useState('');
  const [playerError, setPlayerError] = useState('');
  const cleanChannelUrl = useMemo(
    () => (mode === 'radio' || mode === 'tv' ? normalizeLiveChannelUrl(channel?.url) : channel?.url),
    [channel?.url, mode],
  );
  const playbackSources = useMemo(
    () => buildPlaybackCandidates(cleanChannelUrl, mode === 'radio' ? 'radio' : 'tv').map(proxiedLiveStreamUrl),
    [cleanChannelUrl, mode],
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const playbackUrl = playbackSources[sourceIndex] || playbackSources[0] || cleanChannelUrl || '';
  const isExternalPage = Boolean(channel?.externalPage) || (cleanChannelUrl && !isDirectMediaUrl(cleanChannelUrl));

  useEffect(() => {
    setSourceIndex(0);
  }, [cleanChannelUrl]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !playbackUrl || isExternalPage) return undefined;
    let hls;
    let hasPlayed = false;
    setPlayerStatus('Cargando canal...');
    setPlayerError('');

    const tryNextSource = () => {
      if (hasPlayed || media.currentTime > 0) {
        setPlayerStatus('');
        setPlayerError('');
        return;
      }
      setSourceIndex((current) => {
        if (current + 1 < playbackSources.length) return current + 1;
        setPlayerStatus('');
        setPlayerError('No se pudo reproducir este canal. Prueba otro canal o fuente.');
        return current;
      });
    };

    if (isHlsUrl(playbackUrl) && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => setPlayerStatus(''));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) tryNextSource();
      });
      hls.loadSource(playbackUrl);
      hls.attachMedia(media);
    } else if (isHlsUrl(playbackUrl) && media.canPlayType('application/vnd.apple.mpegurl')) {
      media.src = playbackUrl;
    } else {
      media.src = playbackUrl;
    }

    const handlePlaying = () => {
      hasPlayed = true;
      setPlayerStatus('');
      setPlayerError('');
    };
    const handleWaiting = () => {
      if (!hasPlayed) setPlayerStatus('Cargando canal...');
    };
    const handleError = () => {
      tryNextSource();
    };

    media.addEventListener('playing', handlePlaying);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('error', handleError);

    return () => {
      if (hls) hls.destroy();
      media.removeEventListener('playing', handlePlaying);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('error', handleError);
      media.removeAttribute('src');
      media.load();
    };
  }, [playbackUrl, playbackSources.length, isExternalPage]);

  if (!channel) {
    return (
      <div className="live-player-empty">
        {mode === 'radio' ? <Radio size={52} /> : <Tv size={52} />}
        <span>Selecciona {mode === 'radio' ? 'una radio' : 'un canal'} para comenzar</span>
      </div>
    );
  }

  if (mode === 'radio') {
    return (
      <div className="radio-player">
        {channel.logo ? <img src={channel.logo} alt="" /> : <Radio size={72} />}
        <strong>{channel.name}</strong>
        <audio className="live-audio" ref={mediaRef} controls autoPlay />
      </div>
    );
  }

  if (isExternalPage) {
    return (
      <div className="external-live-card">
        {channel.logo ? <img src={channel.logo} alt="" /> : <Tv size={72} />}
        <div>
          <span>{channel.sourceType || 'Fuente externa'}</span>
          <strong>{channel.name}</strong>
          <p>Este contenido viene de una pagina externa visible. Abre la fuente para verlo en su sitio oficial.</p>
          <a href={channel.url} target="_blank" rel="noreferrer">
            Abrir fuente
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="live-player-shell">
      <video className="live-player" ref={mediaRef} controls playsInline autoPlay />
      {(playerStatus || playerError) && (
        <div className={`live-player-message ${playerError ? 'error' : ''}`}>
          {playerError || playerStatus}
        </div>
      )}
    </div>
  );
}

function isLikelyRadioSource(source) {
  const text = normalizeText(`${source?.name || ''} ${source?.group || ''} ${source?.url || ''}`);
  return text.includes('radio') || text.includes('musica');
}

function isValidChannelTitle(value) {
  const name = String(value || '').trim();
  const normalized = normalizeText(name);
  if (name.length < 2) return false;
  if (/^\d+$/.test(name)) return false;
  if (['canal', 'channel', 'live', 'tv'].includes(normalized)) return false;
  return /[a-z0-9]/.test(normalized);
}

function dedupeChannelsReducer(items, channel) {
  const channelKey = getChannelDedupeKey(channel);
  if (!channelKey) return items;
  const exists = items.some((item) => getChannelDedupeKey(item) === channelKey);
  if (exists) return items;
  return [...items, channel];
}

function getChannelDedupeKey(channel) {
  const urlKey = getStableStreamUrlKey(channel?.url);
  const nameKey = getStableChannelNameKey(channel?.name);
  const groupKey = getStableChannelNameKey(channel?.group);
  return urlKey || `${groupKey}:${nameKey}`;
}

function getStableStreamUrlKey(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 3) {
      const id = parts[parts.length - 1].replace(/\.[^.]+$/, '');
      const type = ['live', 'movie', 'series'].includes(parts[0]) ? parts[0] : 'live';
      return `${url.hostname}:${type}:${id}`;
    }
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '').toLowerCase();
  } catch {
    return normalizeText(value);
  }
}

function getStableChannelNameKey(value) {
  return normalizeText(value || '')
    .replace(/\b(uhd|fhd|full\s*hd|hd|sd|4k|1080p|720p|latino|castellano|backup|opcion|opci[oó]n)\b/g, ' ')
    .replace(/\b(cl|chile|ar|argentina|mx|mexico|es|espana|pe|peru|co|colombia|bo|bolivia|ve|venezuela)\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getChannelFavoriteId(channel, mode = 'tv') {
  return `${mode}:${channel?.url || channel?.name || ''}`;
}

function normalizeChannelFavorite(channel, source, mode = 'tv') {
  return {
    id: getChannelFavoriteId(channel, mode),
    mode,
    name: channel.name,
    group: channel.group || source?.name || (mode === 'radio' ? 'Radio' : 'TV'),
    logo: channel.logo || '',
    url: channel.url,
    sourceName: source?.name || '',
    sourceGroup: source?.group || '',
  };
}

function buildInitialTvSources() {
  return withPrivateTvSource([]);
}

function withPrivateTvSource(sources, channels = null, error = '') {
  if (!PRIVATE_TV_PROXY_URL) return [];

  return [
    {
      group: 'M@umora privado',
      name: 'M@umora TV privada',
      url: PRIVATE_TV_PROXY_URL,
      channels: Array.isArray(channels) ? channels : [],
      error: error || (Array.isArray(channels) ? '' : 'Cargando lista privada...'),
    },
  ];
}

function isRadioChannel(channel, source) {
  if (normalizeText(source?.name || '') === 'tdtchannels radio') return true;
  const text = normalizeText(`${source?.name || ''} ${source?.group || ''} ${channel?.name || ''} ${channel?.group || ''} ${channel?.logo || ''} ${channel?.url || ''}`);
  return (
    text.includes('radios') ||
    text.includes(' radio') ||
    text.startsWith('radio') ||
    /\bfm\b/.test(text) ||
    /\bam\b/.test(text) ||
    text.includes('streamtheworld') ||
    text.includes('icecast') ||
    text.includes('shoutcast') ||
    text.includes('emisora')
  );
}

function isVodChannel(channel, source) {
  const group = normalizeText(`${source?.name || ''} ${source?.group || ''} ${channel?.group || ''}`);
  const text = normalizeText(`${group} ${channel?.name || ''} ${channel?.url || ''}`);
  const vodTokens = [
    'vod',
    'pelicula',
    'peliculas',
    'movie',
    'movies',
    'estreno',
    'estrenos',
    'cine',
    'cinema',
  ];
  const genreVodTokens = [
    'accion',
    'comedia',
    'terror',
    'drama',
    'suspenso',
    'thriller',
    'infantil',
    'documental',
  ];

  return vodTokens.some((token) => group.includes(token) || text.includes(`/${token}/`))
    || (group.includes('vod') && genreVodTokens.some((token) => group.includes(token)))
    || /\/(movie|vod)\//i.test(channel?.url || '');
}

function parseM3u(text, sourceName) {
  return parseM3uEntries(text, sourceName).map((entry) => ({
    name: entry.name,
    group: entry.group,
    logo: proxiedImageUrl(entry.logo),
    url: normalizeLiveChannelUrl(entry.url),
  }));
}

function parseM3uEntries(text, sourceName) {
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
        logo: proxiedImageUrl(getM3uAttribute(line, 'tvg-logo')),
        tvgName: getM3uAttribute(line, 'tvg-name'),
        tvgId: getM3uAttribute(line, 'tvg-id'),
      };
      return;
    }

    if (!line.startsWith('#') && current) {
      channels.push({
        ...current,
        url: line,
      });
      current = null;
    }
  });

  return channels.filter((channel) => /^https?:\/\//i.test(channel.url));
}

function normalizeLiveChannelUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 3 && !['live', 'movie', 'series'].includes(parts[0])) {
      const [user, pass, id] = parts;
      return `${url.origin}/live/${user}/${pass}/${id}.m3u8`;
    }
    if (parts.length === 4 && parts[0] === 'live') {
      const [, user, pass, idWithExt] = parts;
      const id = idWithExt.replace(/\.[^.]+$/, '');
      return `${url.origin}/live/${user}/${pass}/${id}.m3u8`;
    }
  } catch {
    return value;
  }
  return value;
}

function parsePrivateM3uCatalog(text) {
  const entries = parseM3uEntries(text, 'M@umora TV privada');
  const tvChannels = [];
  const movies = [];
  const seriesMap = new Map();
  const animeMap = new Map();

  entries.forEach((entry, index) => {
    const kind = classifyPrivateM3uEntry(entry);
    if (kind === 'movie') {
      if (movies.length < PRIVATE_IMPORT_LIMITS.movies) {
        const movie = privateEntryToMovie(entry, index);
        if (isValidPrivateTitle(movie.titulo)) movies.push(movie);
      }
      return;
    }

    if (kind === 'series' || kind === 'anime') {
      const episode = privateEntryToEpisode(entry, index);
      const map = kind === 'anime' ? animeMap : seriesMap;
      if (!map.has(episode.seriesId) && map.size >= PRIVATE_IMPORT_LIMITS.shows) return;
      if (!isValidPrivateTitle(episode.seriesTitle)) return;
      if (!map.has(episode.seriesId)) {
        map.set(episode.seriesId, privateEpisodeToShow(entry, episode, kind));
      }
      if (map.get(episode.seriesId).episodes.length >= PRIVATE_IMPORT_LIMITS.episodesPerShow) return;
      map.get(episode.seriesId).episodes.push(episode);
      return;
    }

    if (tvChannels.length < PRIVATE_IMPORT_LIMITS.tvChannels && isValidPrivateTitle(entry.name)) {
      tvChannels.push({
        name: entry.name,
        group: entry.group || 'M@umora TV privada',
        logo: proxiedImageUrl(entry.logo),
        url: normalizeLiveChannelUrl(entry.url),
      });
    }
  });

  return {
    movies: sortCatalogByYearDesc(dedupeCatalogItems(movies)),
    series: finalizePrivateShows(seriesMap, 'serie'),
    anime: finalizePrivateShows(animeMap, 'anime'),
    tvChannels,
  };
}

function classifyPrivateM3uEntry(entry) {
  const groupText = normalizeText(entry.group || '');
  const nameText = normalizeText(`${entry.name || ''} ${entry.tvgName || ''}`);
  const urlText = normalizeText(entry.url || '');
  const text = `${groupText} ${nameText} ${urlText}`;
  if (isLikelyRadioSource({ name: entry.name, group: entry.group, url: entry.url })) return 'tv';
  if (text.includes('/series/') || hasEpisodePattern(text)) {
    return text.includes('anime') || text.includes('animacion') ? 'anime' : 'series';
  }
  if (
    urlText.includes('/movie/') ||
    isPrivateMovieGroup(groupText) ||
    isPrivateMovieName(nameText) ||
    /\.(mp4|mkv|avi|mov|m4v|webm)(\?|#|$)/i.test(entry.url || '')
  ) {
    return text.includes('anime') || text.includes('animacion') ? 'anime' : 'movie';
  }
  return 'tv';
}

function isPrivateMovieGroup(value) {
  return [
    'pelicula',
    'peliculas',
    'movie',
    'movies',
    'vod',
    'cine',
    'cinema',
    'estreno',
    'estrenos',
    'accion',
    'comedia',
    'terror',
    'drama',
    'suspenso',
    'thriller',
    'infantil',
    'documental',
    '24/7',
    '24 7',
  ].some((token) => value.includes(token));
}

function isPrivateMovieName(value) {
  return /\b(19\d{2}|20\d{2})\b/.test(value)
    && !/\b(s\d{1,2}e\d{1,3}|t\d{1,2}e\d{1,3}|\d{1,2}x\d{1,3})\b/i.test(value);
}

function hasEpisodePattern(value) {
  return /\bs\d{1,2}\s*e\d{1,3}\b/i.test(value)
    || /\b\d{1,2}x\d{1,3}\b/i.test(value)
    || /\btemporada\s*\d{1,2}.*episodio\s*\d{1,3}\b/i.test(value)
    || /\bt\d{1,2}\s*e\d{1,3}\b/i.test(value);
}

function privateEntryToMovie(entry, index) {
  const title = cleanPrivateMovieTitle(entry.name || entry.tvgName || `Pelicula ${index + 1}`);
  const id = `private-movie-${slugifyId(`${title}-${entry.url}`)}`;
  const year = extractPrivateYear(entry.name) || extractPrivateYear(entry.group) || '';
  return {
    id,
    titulo: title,
    sinopsis: '',
    genero: cleanPrivateGroup(entry.group) || 'Pelicula',
    categoria: 'movie',
    año: year,
    posterUrl: proxiedImageUrl(entry.logo) || '/logo.png',
    backdropUrl: proxiedImageUrl(entry.logo) || '/logo.png',
    valoracion: '',
    urlReproduccion: entry.url,
    detailUrl: `/detail/movie/${id}`,
    watchUrl: `/watch/movie/${id}`,
    status: 'visible',
    privateSource: true,
  };
}

function privateEntryToEpisode(entry, index) {
  const parsed = parsePrivateEpisodeName(entry.name || entry.tvgName || `Episodio ${index + 1}`);
  const seriesTitle = parsed.seriesTitle || cleanPrivateMovieTitle(entry.name || `Serie ${index + 1}`);
  const seriesId = `private-show-${slugifyId(`${seriesTitle}-${entry.group || ''}`)}`;
  return {
    seriesTitle,
    seriesId,
    temporada: String(parsed.season || 1),
    episodio: String(parsed.episode || index + 1),
    tituloEpisodio: parsed.episodeTitle || `Episodio ${parsed.episode || index + 1}`,
    urlReproduccion: entry.url,
  };
}

function privateEpisodeToShow(entry, episode, kind) {
  const title = episode.seriesTitle || cleanPrivateMovieTitle(entry.name || 'Serie');
  const year = extractPrivateYear(entry.name) || extractPrivateYear(entry.group) || '';
  return {
    id: episode.seriesId,
    titulo: title,
    sinopsis: '',
    genero: cleanPrivateGroup(entry.group) || (kind === 'anime' ? 'Anime' : 'Serie'),
    categoria: kind === 'anime' ? 'anime' : 'serie',
    año: year,
    posterUrl: proxiedImageUrl(entry.logo) || '/logo.png',
    backdropUrl: proxiedImageUrl(entry.logo) || '/logo.png',
    totalSeasons: 1,
    totalEpisodes: 0,
    detailUrl: `/detail/${kind === 'anime' ? 'anime' : 'serie'}/${episode.seriesId}`,
    episodes: [],
    status: 'visible',
    privateSource: true,
  };
}

function finalizePrivateShows(map, category) {
  return sortCatalogByYearDesc(Array.from(map.values()).map((show) => {
    const episodes = dedupeEpisodes(show.episodes);
    const seasons = new Set(episodes.map((episode) => String(episode.temporada || '1')));
    return {
      ...show,
      categoria: category,
      totalSeasons: seasons.size || 1,
      totalEpisodes: episodes.length,
      episodes,
    };
  }));
}

function parsePrivateEpisodeName(name) {
  const value = String(name || '').trim();
  const patterns = [
    /^(.*?)\s*[-_. ]+s(\d{1,2})\s*e(\d{1,3})\s*[-_. ]*(.*)$/i,
    /^(.*?)\s*[-_. ]+(\d{1,2})x(\d{1,3})\s*[-_. ]*(.*)$/i,
    /^(.*?)\s*[-_. ]+t(\d{1,2})\s*e(\d{1,3})\s*[-_. ]*(.*)$/i,
    /^(.*?)\s*temporada\s*(\d{1,2}).*?episodio\s*(\d{1,3})\s*[-_. ]*(.*)$/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      return {
        seriesTitle: cleanPrivateMovieTitle(match[1]),
        season: Number(match[2]) || 1,
        episode: Number(match[3]) || 1,
        episodeTitle: cleanPrivateMovieTitle(match[4] || `Episodio ${Number(match[3]) || 1}`),
      };
    }
  }

  return {
    seriesTitle: cleanPrivateMovieTitle(value),
    season: 1,
    episode: 1,
    episodeTitle: 'Episodio 1',
  };
}

function cleanPrivateMovieTitle(value) {
  return String(value || '')
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/\((19|20)\d{2}\)/g, ' ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(1080p|720p|4k|uhd|fhd|hd|latino|castellano|subtitulado|dual|vod|movie)\b/gi, ' ')
    .replace(/[._]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Sin titulo';
}

function isValidPrivateTitle(value) {
  const title = String(value || '').trim();
  const normalized = normalizeText(title);
  if (title.length < 3) return false;
  if (/^\d+$/.test(title)) return false;
  if (/^[a-z]{0,3}\d{3,}[a-z0-9-]*$/i.test(title)) return false;
  if (['sin titulo', 'canal', 'pelicula', 'movie', 'vod', 'live'].includes(normalized)) return false;
  return /[a-zA-ZÀ-ÿ]/.test(title);
}

function cleanPrivateGroup(value) {
  return String(value || '')
    .replace(/\b(vod|movies?|peliculas?|series?|live|tv)\b/gi, ' ')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPrivateYear(value) {
  const match = String(value || '').match(/\b(19\d{2}|20\d{2})\b/);
  return match?.[1] || '';
}

function slugifyId(value) {
  return normalizeText(value || '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || Math.random().toString(36).slice(2);
}

function dedupeCatalogItems(items) {
  return Array.from(new Map(items.map((item) => [`${normalizeText(item.titulo)}-${item.urlReproduccion || item.id}`, item])).values());
}

function mergeCatalogItems(primary, extra) {
  return sortCatalogByYearDesc(Array.from(
    new Map([...(primary || []), ...(extra || [])].map((item) => [`${item.categoria || 'movie'}:${item.id || item.titulo}`, item])).values(),
  ));
}

function dedupeEpisodes(episodes) {
  return Array.from(
    new Map(episodes.map((episode) => [`${episode.temporada}-${episode.episodio}-${episode.urlReproduccion}`, episode])).values(),
  ).sort((left, right) => {
    const seasonDiff = (Number(left.temporada) || 1) - (Number(right.temporada) || 1);
    if (seasonDiff !== 0) return seasonDiff;
    return (Number(left.episodio) || 1) - (Number(right.episodio) || 1);
  });
}

function getM3uAttribute(line, name) {
  const match = line.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match?.[1]?.trim() || '';
}

function getYouTubeId(value) {
  if (!value) return null;
  if (/^[\w-]{8,}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return url.pathname.replace('/', '');
    return url.searchParams.get('v');
  } catch {
    return null;
  }
}

function Rail({ row, navigate }) {
  const rowRef = useRef(null);
  const cards = useMemo(
    () =>
      row.items.map(([title, category, meta], index) => ({
        title,
        category,
        meta,
        item: row.items[index][3],
        image: posterImages[index % posterImages.length],
      })),
    [row],
  );
  const scrollRow = (direction) => {
    if (!rowRef.current) return;
    const distance = rowRef.current.clientWidth * 0.82;
    rowRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section className="rail group-rail" aria-labelledby={row.title}>
      <div className="rail-heading">
        <span />
        <h2 id={row.title}>{row.title}</h2>
      </div>
      <div className="rail-window">
        <button className="rail-arrow rail-arrow-left" onClick={() => scrollRow('left')} aria-label="Anterior">
          <ChevronLeft size={30} />
        </button>
        <div className={`poster-row ${row.variant}`} ref={rowRef}>
          {cards.map((item, index) => (
            <article className="poster-card" key={item.title}>
              {row.variant === 'top' && <strong className="rank">{index + 1}</strong>}
              <span className="hover-info">
                <strong>{item.title}</strong>
                <small>{[item.category, item.meta].filter(Boolean).join(' - ')}</small>
              </span>
              <a
                className="poster-art"
                href={item.item?.detailUrl || `/detail/movie/${item.item?.id || index}`}
                onClick={(event) => {
                  if (!item.item || !navigate) return;
                  event.preventDefault();
                  navigate(item.item.detailUrl || `/detail/movie/${item.item.id}`);
                }}
              >
                <img src={item.item?.backdropUrl || item.item?.posterUrl || item.image} alt="" />
                <RatingBadge
                  item={item.item}
                  category={item.item?.categoria || 'movie'}
                  contentStats={row.contentStats}
                />
                <span className="card-title-strip">
                  <strong>{item.title}</strong>
                  <small>{[item.category, item.meta].filter(Boolean).join(' - ')}</small>
                </span>
              </a>
              <div className="poster-caption">
                <h3>{item.title}</h3>
                <p>
                  {item.category} - {item.meta}
                </p>
              </div>
            </article>
          ))}
        </div>
        <button className="rail-arrow rail-arrow-right" onClick={() => scrollRow('right')} aria-label="Siguiente">
          <ChevronRight size={30} />
        </button>
      </div>
    </section>
  );
}

function MobileNav({ path, navigate }) {
  const items = [
    [Home, 'Inicio', '/home'],
    [Film, 'Films', '/movies'],
    [Tv, 'Series', '/series'],
    [Sparkles, 'Anime', '/anime'],
    [Tv, 'TV', '/tv'],
    [Radio, 'Radio', '/radio'],
    [User, 'Lista', '/mylist'],
  ];

  return (
    <nav className="mobile-nav" aria-label="Navegacion movil">
      {items.map(([Icon, label, href]) => (
        <a
          href={href}
          key={label}
          className={path === href ? 'active' : ''}
          onClick={(event) => {
            event.preventDefault();
            navigate(href);
          }}
        >
          <Icon size={21} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

function RequestModal({ onClose }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Pedir contenido">
      <button className="modal-backdrop" onClick={onClose} aria-label="Cerrar" />
      <section className="request-modal">
        <div className="modal-head">
          <div>
            <h2>Pedir contenido</h2>
            <p>1 pedido por semana por perfil</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <label>
          Tipo
          <span className="type-group">
            <button>Pelicula</button>
            <button>Serie</button>
            <button>Anime</button>
          </span>
        </label>
        <label>
          Titulo
          <input placeholder="Nombre del contenido..." />
        </label>
        <label>
          Comentario
          <textarea placeholder="Temporada, año, detalles..." rows={3} />
        </label>
        <button className="submit-request">
          <Download size={18} />
          Enviar pedido
        </button>
      </section>
    </div>
  );
}

export default App;
