import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import BackgroundPattern from './components/decorative/BackgroundPattern';
import Navbar from './components/layout/Navbar';
import AudioPlayer from './components/reader/AudioPlayer';
import ServiceWorkerRegistrar from './components/ui/ServiceWorkerRegistrar';

const HomePage = lazy(() => import('./components/home/HomePage'));
const QuranReader = lazy(() => import('./components/reader/QuranReader'));
const RecitersPage = lazy(() => import('./components/RecitersPage'));
const ReciterDetail = lazy(() => import('./components/ReciterDetail'));
const AdhkarDashboard = lazy(() => import('./components/features/AdhkarDashboard'));
const Tasbih = lazy(() => import('./components/features/Tasbih'));
const QuizMode = lazy(() => import('./components/features/QuizMode'));
const TajwidGuide = lazy(() => import('./components/features/TajwidGuide'));
const MemorizeMode = lazy(() => import('./components/features/MemorizeMode'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );
}


const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/quran': 'Quran',
  '/reciters': 'Reciters',
  '/adhkar': 'Adhkar',
  '/tasbih': 'Tasbih',
  '/quiz': 'Quiz',
  '/tajwid': 'Tajweed',
  '/memorize': 'Memorize',
  '/profile': 'Profile',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/quran')) return 'Quran';
  if (pathname.startsWith('/reciters')) return 'Reciters';
  return PAGE_TITLES[pathname] || 'NoorQuran';
}

const STORAGE_KEY = 'misbah_last_route';
const SAVED = (() => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && v !== '/' ? v : null;
  } catch { return null }
})();

function AnimatedRoutes() {
  const location = useLocation();
  const { showAudioPlayer, closeAudioPlayer } = useApp();
  const [initialPath, setInitialPath] = useState<string | null>(SAVED);

  useEffect(() => {
    if (initialPath && location.pathname === initialPath) {
      setInitialPath(null);
    }
  }, [location.pathname, initialPath]);

  useEffect(() => {
    if (initialPath) return;
    localStorage.setItem(STORAGE_KEY, location.pathname);
  }, [location.pathname, initialPath]);

  useEffect(() => {
    document.title = `NoorQuran — ${getPageTitle(location.pathname)}`;
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/profile') {
      closeAudioPlayer();
    }
  }, [location.pathname, closeAudioPlayer]);

  if (initialPath) {
    return <Navigate to={initialPath} replace />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 overflow-x-hidden">
      <BackgroundPattern />
      <Navbar />
      <div className="pt-[56px]" style={{ paddingBottom: showAudioPlayer ? '5rem' : '0' }}>
        <Routes location={location}>
          <Route path="/" element={<Suspense fallback={<RouteFallback />}><HomePage /></Suspense>} />
          <Route path="/quran/:surahId?" element={<Suspense fallback={<RouteFallback />}><QuranReader /></Suspense>} />
          <Route path="/reciters" element={<Suspense fallback={<RouteFallback />}><RecitersPage /></Suspense>} />
          <Route path="/reciters/:reciterId" element={<Suspense fallback={<RouteFallback />}><ReciterDetail /></Suspense>} />
          <Route path="/adhkar" element={<Suspense fallback={<RouteFallback />}><AdhkarDashboard /></Suspense>} />
          <Route path="/tasbih" element={<Suspense fallback={<RouteFallback />}><Tasbih /></Suspense>} />
          <Route path="/quiz" element={<Suspense fallback={<RouteFallback />}><QuizMode /></Suspense>} />
          <Route path="/tajwid" element={<Suspense fallback={<RouteFallback />}><TajwidGuide /></Suspense>} />
          <Route path="/memorize" element={<Suspense fallback={<RouteFallback />}><MemorizeMode /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<RouteFallback />}><ProfilePage /></Suspense>} />
        </Routes>
      </div>
      {showAudioPlayer && <AudioPlayer />}
      <ServiceWorkerRegistrar />

      <footer
        className="w-full text-center py-4 text-[10px] tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Created by Montassar Ben Fraj &mdash; NoorQuran v1.0.0
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AnimatedRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
