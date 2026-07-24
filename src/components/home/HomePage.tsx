import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Mic, Sparkles, Lamp, Brain, MapPin, Sunrise, Sun, CloudSun, Sunset, Moon, CloudMoon, ChevronLeft, Heart, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getNextPrayer } from '../../services/prayerApi';
import VerseOfTheDay from '../features/VerseOfTheDay';
import LocationModal from '../layout/LocationModal';
import { SURAHS } from '../../data/surahs';
import { getWorkingReciters, getReciterImageUrl } from '../../data/reciters-data';
import { ADHKAR } from '../../data/adhkar-data';

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_NAMES_AR = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
const PRAYER_ICONS = [Sunrise, Sun, CloudSun, Sunset, Moon, CloudMoon];

const WORKING_RECITERS = getWorkingReciters();

export default function HomePage() {
  const navigate = useNavigate();
  const { language, userLocation, prayerTimes, settings, updateSettings } = useApp();
  const [locationOpen, setLocationOpen] = useState(false);
  const [next, setNext] = useState<{ name: string; time: string; remaining: number } | null>(null);
  const [adhkarAtEnd, setAdhkarAtEnd] = useState(false);
  const [windowHeight, setWindowHeight] = useState(600);
  const adhkarSectionRef = useRef<HTMLDivElement>(null);
  const adhkarStickyRef = useRef<HTMLDivElement>(null);
  const adhkarScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
  }, []);

  useEffect(() => {
    const el = adhkarStickyRef.current;
    const con = adhkarScrollRef.current;
    if (!el || !con) return;
    const handler = (e: WheelEvent) => {
      const atEnd = con.scrollLeft + con.clientWidth >= con.scrollWidth - 10;
      if (!atEnd) {
        e.preventDefault();
        con.scrollLeft += e.deltaY;
        setAdhkarAtEnd(false);
      } else {
        setAdhkarAtEnd(true);
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;
    const tick = () => {
      const n = getNextPrayer(prayerTimes);
      setNext(n);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const names = language === 'ar' ? PRAYER_NAMES_AR : PRAYER_NAMES;
  const getNameAr = (name: string) => {
    const map: Record<string, string> = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
    return map[name] || name;
  };

  const lastSurahMeta = SURAHS[settings.lastSurah - 1];
  const hasContinuedReading = settings.lastSurah > 1 || settings.lastVerse > 1;

  return (
    <div className="w-full">
      {/* Hero Section — full viewport */}
      <section className="flex flex-col items-center justify-center gap-6 min-h-[calc(100vh-4rem)] pt-16 px-6 md:px-10 lg:px-16 xl:px-24 max-w-7xl mx-auto">
        {/* Next prayer countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <button
            onClick={() => setLocationOpen(true)}
            className="flex items-center gap-1.5 mx-auto mb-3 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <MapPin size={12} />
            {userLocation?.city ? userLocation.city.substring(0, 12) : (language === 'ar' ? 'تحديد الموقع' : 'Set Location')}
          </button>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            {language === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
          </p>
          {next ? (
            <>
              <p className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                {language === 'ar' ? getNameAr(next.name) : next.name}
              </p>
              <p className="text-5xl sm:text-7xl font-mono font-bold tabular-nums leading-none mb-2" style={{ color: 'var(--text-primary)' }}>
                {formatCountdown(Math.round((next?.remaining ?? 0) * 60))}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {language === 'ar' ? 'وقت الصلاة' : 'at'} {next.time}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'اضبط موقعك' : 'Set your location'}
            </p>
          )}
        </motion.div>

        {/* Prayer times grid */}
        {prayerTimes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-md"
          >
            <div className="grid grid-cols-3 gap-2">
              {PRAYER_NAMES.map((name, idx) => {
                const time = (prayerTimes as any)[name.toLowerCase()];
                const isNext = next?.name === name;
                const Icon = PRAYER_ICONS[idx];
                return (
                  <div
                    key={name}
                    className="rounded-xl py-2 px-1 text-center flex flex-col items-center gap-1 transition-all border"
                    style={{
                      background: isNext ? 'var(--accent-bg)' : 'var(--bg-card)',
                      borderColor: isNext ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    <Icon size={18} style={{ color: isNext ? 'var(--accent)' : 'var(--text-secondary)' }} />
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {names[idx]}
                    </p>
                    <p className="text-[11px] font-medium" style={{ color: isNext ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {time || '--:--'}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Verse of the Day */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-lg"
        >
          <VerseOfTheDay />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="mt-2"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <svg className="w-5 h-5 mx-auto" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 1: QURAN — full-width background */}
      {/* ============================================================ */}
      <div className="w-full py-8 md:py-10"
        style={{
          background: 'color-mix(in srgb, var(--accent) 6%, var(--bg-card))',
        }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Header */}
            <div className="px-5 md:px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#b8860b20' }}>
                  <BookOpen size={18} style={{ color: '#b8860b' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {language === 'ar' ? 'القرآن الكريم' : 'The Noble Quran'}
                  </h2>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    114 {language === 'ar' ? 'سورة' : 'surahs'}
                  </p>
                </div>
              </div>
            </div>

            {/* Continue Reading banner */}
            {hasContinuedReading && (
              <button
                onClick={() => navigate('/quran/' + settings.lastSurah)}
                className="mx-4 md:mx-5 mt-4 mb-2 px-4 py-3 rounded-lg flex items-center gap-3 w-[calc(100%-2rem)] md:w-[calc(100%-2.5rem)] text-left transition-all hover:opacity-80 cursor-pointer"
                style={{ background: '#b8860b10' }}
              >
                <BookOpen size={14} style={{ color: '#b8860b' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#b8860b' }}>
                    {language === 'ar' ? 'استمر في القراءة' : 'Continue Reading'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {language === 'ar'
                      ? `${lastSurahMeta?.arabic || ''}، ${settings.lastSurah}:${settings.lastVerse}`
                      : `${lastSurahMeta?.name || ''}, ${settings.lastSurah}:${settings.lastVerse}`}
                  </p>
                </div>
              </button>
            )}

            {/* Surah grid — all 114 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 md:p-5">
              {SURAHS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    updateSettings({ lastSurah: s.id });
                    navigate('/quran/' + s.id);
                  }}
                  className="group flex flex-col gap-2 p-4 rounded-xl transition-all duration-200 border hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#b8860b';
                    (e.currentTarget as HTMLElement).style.background = '#b8860b08';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {/* Top row: number+icon left, arabic right */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold shrink-0 transition-colors group-hover:text-[#b8860b]" style={{ color: 'var(--text-muted)' }}>
                        {String(s.id).padStart(3, '0')}
                      </span>
                      {s.revelation === 'Mecca' ? (
                        <svg className="w-3 h-3 transition-transform group-hover:scale-110" viewBox="0 0 100 100" style={{ fill: '#b8860b' }}>
                          <path d="M4.53,81.42l45,15s0,0,0,0c.15,.05,.31,.08,.47,.08s.32-.03,.47-.08c0,0,0,0,0,0l45-15c.61-.2,1.03-.78,1.03-1.42V20c0-.14-.03-.28-.07-.42-.01-.04-.03-.08-.04-.12-.04-.09-.08-.18-.14-.27-.02-.04-.04-.07-.07-.11-.07-.1-.16-.18-.25-.26-.02-.01-.03-.03-.04-.04,0,0,0,0,0,0-.11-.08-.24-.14-.37-.19-.01,0-.02-.01-.03-.02L50.47,3.58c-.31-.1-.64-.1-.95,0L4.53,18.58s-.02,.01-.03,.02c-.13,.05-.25,.11-.37,.19,0,0,0,0,0,0-.02,.01-.03,.03-.04,.04-.1,.08-.18,.16-.25,.26-.03,.03-.05,.07-.07,.11-.06,.09-.1,.17-.14,.27-.02,.04-.03,.08-.04,.12-.04,.14-.07,.28-.07,.42v60c0,.65,.41,1.22,1.03,1.42Zm35.96,8.82l-11.49-3.84v-25.17l11.49,3.84v25.17Zm8.01-40.41v4.34L6.5,40.17v-4.34l42,14Zm45-9.66l-42,14v-4.34l42-14v4.34Zm-43.5-6.75L9.74,20,50,6.58l40.26,13.42-40.26,13.42Z"/>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" viewBox="-5 -10 110 110" style={{ fill: '#1e6b4c' }}>
                          <path d="m80.699 69.102c0-14.699-22.898-30.699-29.199-34.699v-5.6992-0.10156c3.6016-0.39844 6.5-2.8008 7.8008-6-1.1016 0.39844-2.3008 0.69922-3.6016 0.69922-5.3008 0-9.6992-4.3984-9.6992-9.6992 0-1.3008 0.19922-2.5 0.69922-3.6016-3.6016 1.3984-6.1016 4.8984-6.1016 9 0 4.6992 3.3984 8.6016 7.8984 9.5v0.19922 5.6992c-6.1992 4.1016-29.199 20.102-29.199 34.699 0 3.8008 0.69922 7.5 2 10.898h-8.6016l0.003907 10.004h74.602v-10.102h-8.6016c1.3008-3.2969 2-7 2-10.797z"/>
                        </svg>
                      )}
                    </div>
                    <span className="font-arabic text-sm leading-tight text-right transition-colors group-hover:text-[#b8860b]" style={{ color: 'var(--text-primary)' }}>
                      {s.arabic}
                    </span>
                  </div>
                  {/* English name */}
                  <span className="text-[11px] leading-tight text-left transition-colors group-hover:text-[#b8860b]/70" style={{ color: 'var(--text-muted)' }}>
                    {s.name}
                  </span>
                  {/* Bottom row: translation + verse count */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] italic truncate transition-colors group-hover:text-[#b8860b]/50" style={{ color: 'var(--text-secondary)' }}>
                      {s.translation}
                    </span>
                    <span className="text-[11px] shrink-0 transition-colors group-hover:text-[#b8860b]/50" style={{ color: 'var(--text-secondary)' }}>
                      {s.verses} {language === 'ar' ? 'آية' : 'ayat'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: RECITERS — infinite horizontal scroll */}
      {/* ============================================================ */}
      <div className="w-full py-8 md:py-10"
        style={{
          background: 'color-mix(in srgb, #1e6b4c 6%, var(--bg-card))',
        }}>
        <div className="max-w-7xl mx-auto p-6 md:px-10 lg:px-16 xl:px-24 mb-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1e6b4c20' }}>
              <Mic size={18} style={{ color: '#1e6b4c' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? 'القراء' : 'Reciters'}
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {language === 'ar' ? 'استمع إلى جميع القراء' : 'Scroll through all reciters'}
              </p>
            </div>
          </motion.div>
        </div>

        <style>{`
          @keyframes scrollRecitersLtr {
            0% { transform: translateX(0); }
            100% { transform: translateX(50%); }
          }
            @keyframes scrollRecitersRtl {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); 
            }

          
        `}</style>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="group p-6 overflow-hidden"
          
        >
          <div
            className="flex w-max"
            style={{
              animation: language === 'ar' ? 'scrollRecitersLtr 120s linear infinite' : 'scrollRecitersRtl 120s linear infinite',
              animationPlayState: 'running',
            }}
            
            onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
          >
            {[...WORKING_RECITERS, ...WORKING_RECITERS, ...WORKING_RECITERS, ...WORKING_RECITERS].map((r, i) => (
              <button
                key={`${r.id}-${i}`}
                onClick={() => navigate('/reciters/' + r.id)}
                className="flex-shrink-0 flex flex-col items-center mx-4 transition-all duration-300 hover:-translate-y-1 active:scale-[0.97]"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 shadow-md"
                  style={{ borderColor: 'var(--accent)' }}>
                  <img
                    src={getReciterImageUrl(r, 256)}
                    alt={r.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="text-center max-w-[120px] sm:max-w-[140px]">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {r.name}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {r.country} · {r.style}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: ADHKAR — sticky horizontal scroll */}
      {/* ============================================================ */}
      <div ref={adhkarSectionRef} className="relative" style={{ height: `${windowHeight}px` }}>
        <div ref={adhkarStickyRef}
          className="w-full overflow-hidden sticky top-16 p-6"
          style={{
            background: 'color-mix(in srgb, #7c3aed 6%, var(--bg-card))',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-24 h-full flex flex-col justify-center py-8 md:py-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#7c3aed20' }}>
                  <Sparkles size={18} style={{ color: '#7c3aed' }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? 'الأذكار' : 'Adhkar'}
                </h2>
              </div>
              <button onClick={() => navigate('/adhkar')}
                className="flex items-center gap-1 text-xs font-semibold transition-all hover:opacity-70 shrink-0" style={{ color: '#7c3aed' }}>
                {language === 'ar' ? 'عرض الكل' : 'View all'}
                <ArrowRight size={13} />
              </button>
            </div>
            <div ref={adhkarScrollRef} className="flex gap-6 overflow-hidden p-2">
              {ADHKAR.filter((a) => a.category === 'morning').map((a) => (
                <button key={a.id} onClick={() => navigate('/adhkar')}
                  className="flex-shrink-0 w-[min(42rem,85vw)] min-h-[20rem] sm:min-h-[34rem] rounded-2xl text-center transition-all hover:-translate-y-0.5 flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border)',
                    color: 'var(--border)',
                    padding: '5.5rem 4.5rem',
                  }}>
                  <img src="/svg/999586_OIH7TQ1.svg" alt="" aria-hidden="true"
                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                    style={{ objectFit: 'cover', opacity: 0.15 }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2 max-w-full">
                    <p className="text-xl font-arabic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {a.text}
                    </p>
                    <p className="text-sm line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                      {a.translation}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: '#7c3aed12', color: '#7c3aed' }}>
                        {a.count}x
                      </span>
                      {a.reward && (
                        <span className="text-[10px] italic opacity-60" style={{ color: 'var(--text-muted)' }}>
                          {a.reward}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: TASBIH / QUIZ — two feature cards */}
      {/* ============================================================ */}
      <div className="w-full py-8 md:py-10"
        style={{
          background: 'color-mix(in srgb, #d97706 5%, var(--bg-card))',
        }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2.5 mb-5"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#d9770620' }}>
              <Sparkles size={18} style={{ color: '#d97706' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? 'التسبيح والاختبار' : 'Tasbih & Quiz'}
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {language === 'ar' ? 'سبح واختبر معلوماتك' : 'Glorify & test your knowledge'}
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Tasbih card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => navigate('/tasbih')}
            >
              <div className="h-44 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/318451/pexels-photo-318451.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-400/20 backdrop-blur-sm">
                      <Lamp size={16} className="text-amber-300" />
                    </div>
                    <span className="text-base font-bold text-white drop-shadow-sm">
                      {language === 'ar' ? 'التسبيح' : 'Tasbih'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-white/80 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {language === 'ar' ? 'فتح' : 'Open'}
                  </span>
                </div>
              </div>
              <div className="p-4" style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-center justify-around">
                  {[
                    { text: language === 'ar' ? 'سبحان الله' : 'Subhanallah', count: 33 },
                    { text: language === 'ar' ? 'الحمد لله' : 'Alhamdulillah', count: 33 },
                    { text: language === 'ar' ? 'الله أكبر' : 'Allahu Akbar', count: 34 },
                  ].map((d) => (
                    <div key={d.text} className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.text}</span>
                      <span className="text-[11px] font-mono font-bold" style={{ color: '#d97706' }}>{d.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quiz card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => navigate('/quiz')}
            >
              <div className="h-44 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/6873767/pexels-photo-6873767.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-400/20 backdrop-blur-sm">
                      <Brain size={16} className="text-emerald-300" />
                    </div>
                    <span className="text-base font-bold text-white drop-shadow-sm">
                      {language === 'ar' ? 'الاختبار' : 'Quiz'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-white/80 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {language === 'ar' ? 'فتح' : 'Open'}
                  </span>
                </div>
              </div>
              <div className="p-4" style={{ background: 'var(--bg-card)' }}>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { en: 'Quran', ar: 'القرآن' },
                    { en: 'Hadith', ar: 'الحديث' },
                    { en: 'Seerah', ar: 'السيرة' },
                    { en: 'Fiqh', ar: 'الفقه' },
                    { en: 'Tawheed', ar: 'التوحيد' },
                  ].map((c) => (
                    <span key={c.en}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: '#10b98115',
                        color: '#10b981',
                      }}>
                      {language === 'ar' ? c.ar : c.en}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FOOTER — full-width background */}
      {/* ============================================================ */}
      <footer className="w-full py-8 md:py-10"
        style={{
          background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-card))',
        }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-24">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className={`text-xs font-bold mb-3 ${language === 'ar' ? 'text-right' : ''}`} style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? 'التطبيق' : 'App'}
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'quran', en: 'Quran', ar: 'القرآن' },
                  { id: 'reciters', en: 'Reciters', ar: 'القراء' },
                  { id: 'adhkar', en: 'Adhkar', ar: 'الأذكار' },
                  { id: 'tasbih', en: 'Tasbih', ar: 'التسبيح' },
                ].map((f) => (
                  <button key={f.id} onClick={() => navigate('/' + f.id)}
                    className={`text-[11px] ${language === 'ar' ? 'text-right' : 'text-left'} hover:underline transition-all cursor-pointer`} style={{ color: 'var(--text-muted)' }}>
                    {language === 'ar' ? f.ar : f.en}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold mb-3 ${language === 'ar' ? 'text-right' : ''}`} style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? 'المزيد' : 'More'}
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={() => navigate('/quiz')}
                  className={`text-[11px] ${language === 'ar' ? 'text-right' : 'text-left'} hover:underline transition-all`} style={{ color: 'var(--text-muted)' }}>
                  {language === 'ar' ? 'الاختبار' : 'Quiz'}
                </button>
                <button onClick={() => navigate('/profile')}
                  className={`text-[11px] ${language === 'ar' ? 'text-right' : 'text-left'} hover:underline transition-all`} style={{ color: 'var(--text-muted)' }}>
                  {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                </button>
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold mb-3 ${language === 'ar' ? 'text-right' : ''}`} style={{ color: 'var(--text-primary)' }}>
                {language === 'ar' ? 'عن التطبيق' : 'About'}
              </p>
              <p className={`text-[11px] leading-relaxed ${language === 'ar' ? 'text-right' : ''}`} style={{ color: 'var(--text-muted)' }}>
                {language === 'ar'
                  ? 'نور القرآن هو تطبيق إسلامي شامل يقدم القرآن الكريم، الأذكار، التسبيح، والاختبارات.'
                  : 'NoorQuran is a comprehensive Islamic app offering Quran, adhkar, tasbih, and quizzes.'}
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-end justify-end gap-2">
              <div className="flex items-center gap-2">
                <Heart size={13} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  {language === 'ar' ? 'نور القرآن v1.0' : 'NoorQuran v1.0'}
                </span>
                <span className="text-xs leading-relaxed opacity-80" style={{ color: 'var(--text-muted)' }}>
                  © {new Date().getFullYear()} NoorQuran
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </div>
  );
}
