import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mic, Lamp, GraduationCap, Sparkles, User, Menu, X, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import HijriClock from '../ui/HijriClock';
import NavbarPrayerCountdown from './NavbarPrayerCountdown';
import LocationModal from './LocationModal';
import AuthModal from './AuthModal';

const NAV_ITEMS = [
  { id: 'quran', icon: BookOpen, labelEn: 'Quran', labelAr: 'القرآن' },
  { id: 'reciters', icon: Mic, labelEn: 'Reciters', labelAr: 'القراء' },
  { id: 'adhkar', icon: Sparkles, labelEn: 'Adhkar', labelAr: 'الأذكار' },
  { id: 'tasbih', icon: Lamp, labelEn: 'Tasbih', labelAr: 'التسبيح' },
  { id: 'quiz', icon: GraduationCap, labelEn: 'Quiz', labelAr: 'الاختبار' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');
  const { language, setLanguage, t, isAuthenticated, userName, avatarUrl } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (currentPage !== 'home') { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [currentPage]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-30 backdrop-blur-md p-5"
        style={{ background: 'var(--bg-navbar)', borderColor: 'var(--border)', top: 0 }}
      >
        
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg lg:hidden transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 font-bold text-base tracking-wide cursor-pointer"
              style={{ color: 'var(--text-primary)', fontFamily: language === 'en' ? "'Montserrat', sans-serif" : "'Amiri', serif" }}
            >
              <img src="/logo.png" alt={t('appName')} className="w-7 h-7 rounded" />
              <span className="hidden sm:inline text-base">{t('appName')}</span>
            </button>
            <span className="hidden sm:inline"><HijriClock /></span>
          </div>

          {/* Center - Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate('/' + item.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                  style={{
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={14} />
                  {language === 'ar' ? item.labelAr : item.labelEn}
                </button>
              );
            })}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <NavbarPrayerCountdown onOpenLocation={() => setLocationOpen(true)} />
            <ThemeSwitcher />
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer"
              style={{
                background: 'var(--accent-bg)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
              }}
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/profile')}
                className="p-1 rounded-full transition-all border-2 cursor-pointer"
                style={{ borderColor: 'var(--accent)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {userName ? userName.charAt(0).toUpperCase() : <User size={14} />}
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer"
                style={{
                  background: 'var(--accent-bg)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                <LogIn size={14} />
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t lg:hidden overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="grid grid-cols-4 gap-1 p-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate('/' + item.id); setMobileOpen(false); }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer"
                    style={{
                      background: isActive ? 'var(--accent-bg)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={16} />
                    {language === 'ar' ? item.labelAr : item.labelEn}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </nav>

      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
