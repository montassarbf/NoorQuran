import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import BackgroundPattern from './components/decorative/BackgroundPattern';
import Navbar from './components/layout/Navbar';
import HomePage from './components/home/HomePage';
import QuranReader from './components/reader/QuranReader';
import RecitersPage from './components/RecitersPage';
import ReciterDetail from './components/ReciterDetail';
import AdhkarDashboard from './components/features/AdhkarDashboard';
import Tasbih from './components/features/Tasbih';
import QuizMode from './components/features/QuizMode';
import ProfilePage from './components/ProfilePage';
import AudioPlayer from './components/reader/AudioPlayer';
import ServiceWorkerRegistrar from './components/ui/ServiceWorkerRegistrar';


const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/quran': 'Quran',
  '/reciters': 'Reciters',
  '/adhkar': 'Adhkar',
  '/tasbih': 'Tasbih',
  '/quiz': 'Quiz',
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
          <Route path="/" element={<HomePage />} />
          <Route path="/quran/:surahId?" element={<QuranReader />} />
          <Route path="/reciters" element={<RecitersPage />} />
          <Route path="/reciters/:reciterId" element={<ReciterDetail />} />
          <Route path="/adhkar" element={<AdhkarDashboard />} />
          <Route path="/tasbih" element={<Tasbih />} />
          <Route path="/quiz" element={<QuizMode />} />
          <Route path="/profile" element={<ProfilePage />} />
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
