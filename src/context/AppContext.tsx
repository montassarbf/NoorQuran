'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ThemeId, FontSize, DisplayMode, Language, Bookmark, MemorizationProgress, TasbihCounter, PrayerTimes, AppSettings, Word } from '../types';
import { fetchPrayerTimes } from '../services/prayerApi';
import { getSession, onAuthChange, signOut as supabaseSignOut, getProfile, updateProfile, syncBookmarks, getBookmarks } from '../services/supabase';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'golden-glint',
  fontSize: 'md',
  displayMode: 'normal',
  language: 'en',
  showTransliteration: true,
  showWordTranslation: true,
  showVerseTranslation: true,
  reciter: 'Alafasy_128kbps',
  lastSurah: 1,
  lastVerse: 1,
  dailyGoal: 20,
};

interface AppContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
  bookmarks: Bookmark[];
  addBookmark: (b: Bookmark) => void;
  removeBookmark: (surahId: number, verseNumber: number) => void;
  memorization: MemorizationProgress[];
  updateMemorization: (surahId: number, hiddenWords: number[]) => void;
  tasbihCounters: TasbihCounter[];
  updateTasbihCounter: (id: string, count: number) => void;
  resetTasbihCounter: (id: string) => void;
  versesReadToday: number;
  incrementVersesRead: () => void;
  prayerTimes: PrayerTimes | null;
  setPrayerTimes: (pt: PrayerTimes | null) => void;
  userLocation: { city: string; lat: number; lon: number } | null;
  setUserLocation: (loc: { city: string; lat: number; lon: number } | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  userName: string;
  setUserName: (v: string) => void;
  avatarUrl: string;
  setAvatarUrl: (v: string) => void;
  userEmail: string;
  userId: string;
  // Audio playback state
  audioSurah: number;
  audioVerse: number | null;
  showAudioPlayer: boolean;
  audioPlayMode: 'surah' | 'verse';
  audioTotalVerses: number;
  audioWords: Word[];
  audioHighlightedWord: { verse: number; wordIndex: number } | null;
  // Audio actions
  playVerseAudio: (surahId: number, verseNum: number, mode: 'surah' | 'verse', totalVerses: number, words: Word[]) => void;
  stopAudio: () => void;
  setAudioSurah: (surah: number) => void;
  setAudioVerse: (verse: number) => void;
  setAudioWords: (words: Word[]) => void;
  setAudioHighlightedWord: (w: { verse: number; wordIndex: number } | null) => void;
  closeAudioPlayer: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

let storagePrefix = 'misbah_';

export function getStorageKey(key: string): string {
  return `${storagePrefix}${key}`;
}

export function setStoragePrefix(prefix: string) {
  storagePrefix = prefix;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`${storagePrefix}${key}`);
    if (item) return JSON.parse(item);
  } catch {}
  return fallback;
}

function saveToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
  } catch {}
}

function migrateGuestToUser(userPrefix: string) {
  const guestKeys = ['settings', 'bookmarks', 'memorization', 'tasbih', 'versesToday'];
  guestKeys.forEach(k => {
    const guestVal = localStorage.getItem(`misbah_${k}`);
    if (guestVal !== null && localStorage.getItem(`${userPrefix}${k}`) === null) {
      localStorage.setItem(`${userPrefix}${k}`, guestVal);
    }
    localStorage.removeItem(`misbah_${k}`);
  });
}

const translations: Record<string, Record<string, string>> = {
  en: {
    appName: 'NoorQuran', home: 'Home', quran: 'Quran', reciters: 'Reciters',
    adhkar: 'Adhkar', tasbih: 'Tasbih', quiz: 'Quiz', memorize: 'Memorize',
    profile: 'Profile', settings: 'Settings', searchSurah: 'Search surah...',
    loading: 'Loading...', play: 'Play', pause: 'Pause', stop: 'Stop',
    bookmarks: 'Bookmarks', verseOfTheDay: 'Verse of the Day',
    prayerTimes: 'Prayer Times', nextPrayer: 'Next Prayer',
    fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
    morningAdhkar: 'Morning Adhkar', eveningAdhkar: 'Evening Adhkar',
    tasbihCounter: 'Tasbih', tapToCount: 'Tap to Count',
    memorization: 'Memorize', quizMode: 'Quiz', score: 'Score',
    streak: 'Streak', signIn: 'Sign In', signOut: 'Sign Out',
    english: 'English', arabic: 'Arabic', language: 'Language',
    theme: 'Theme', fontSize: 'Font Size',
    goldenGlint: 'Golden Glint', classicLight: 'Classic Light',
    silverLining: 'Silver Lining', vintageSepia: 'Vintage Sepia',
    mochaNight: 'Mocha Night', midnightBlue: 'Midnight Blue',
    forestGreen: 'Forest Green', oledBlack: 'OLED Black', darkLuxury: 'Dark Luxury',
    audioUnavailable: 'Audio Unavailable',
    tafsir: 'Tafsir',
    tafsirUnavailable: 'Tafsir not available',
    hide: 'Hide',
  },
  ar: {
    appName: 'نور القرآن', home: 'الرئيسية', quran: 'القرآن', reciters: 'القراء',
    adhkar: 'الأذكار', tasbih: 'التسبيح', quiz: 'الاختبار', memorize: 'الحفظ',
    profile: 'الملف الشخصي', settings: 'الإعدادات', searchSurah: 'ابحث عن سورة...',
    loading: 'جاري التحميل...', play: 'تشغيل', pause: 'إيقاف', stop: 'إيقاف',
    bookmarks: 'العلامات', verseOfTheDay: 'آية اليوم',
    prayerTimes: 'مواقيت الصلاة', nextPrayer: 'الصلاة القادمة',
    fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
    morningAdhkar: 'أذكار الصباح', eveningAdhkar: 'أذكار المساء',
    tasbihCounter: 'المسبحة', tapToCount: 'اضغط للعد',
    memorization: 'الحفظ', quizMode: 'الاختبار', score: 'النتيجة',
    streak: 'السلسلة', signIn: 'تسجيل الدخول', signOut: 'تسجيل الخروج',
    english: 'الإنجليزية', arabic: 'العربية', language: 'اللغة',
    theme: 'المظهر', fontSize: 'حجم الخط',
    goldenGlint: 'الذهبي', classicLight: 'الفاتح الكلاسيكي',
    silverLining: 'الفضي', vintageSepia: 'البني الدافئ',
    mochaNight: 'الليلي البني', midnightBlue: 'الأزرق الداكن',
    forestGreen: 'الأخضر الغابي', oledBlack: 'الأسود الأسود', darkLuxury: 'الفاخر الداكن',
    audioUnavailable: 'الصوت غير متاح',
    tafsir: 'التفسير',
    tafsirUnavailable: 'التفسير غير متاح',
    hide: 'إخفاء',
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage('settings', DEFAULT_SETTINGS));
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadFromStorage('bookmarks', []));
  const [memorization, setMemorization] = useState<MemorizationProgress[]>(() => loadFromStorage('memorization', []));
  const [tasbihCounters, setTasbihCounters] = useState<TasbihCounter[]>(() => loadFromStorage('tasbih', []));
  const [versesReadToday, setVersesReadToday] = useState<number>(() => {
    const d = loadFromStorage<{ date: string; count: number }>('versesToday', { date: '', count: 0 });
    const today = new Date().toDateString();
    return d.date === today ? d.count : 0;
  });
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [userLocation, setUserLocation] = useState<{ city: string; lat: number; lon: number } | null>(() => {
    const saved = loadFromStorage<{ city: string; lat: number; lon: number } | null>('userLocation', null);
    return saved;
  });
  const [isAuthenticated, setIsAuthenticatedState] = useState(() => loadFromStorage('isAuthenticated', false));
  const [userName, setUserNameState] = useState(() => loadFromStorage('userName', ''));
  const [avatarUrl, setAvatarUrlState] = useState(() => loadFromStorage('avatarUrl', ''));
  const [userEmail, setUserEmail] = useState('');

  const handleSetUserLocation = useCallback((loc: { city: string; lat: number; lon: number } | null) => {
    setUserLocation(loc);
    if (loc) saveToStorage('userLocation', loc);
    else localStorage.removeItem(getStorageKey('userLocation'));
  }, []);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const prefix = userId ? `misbah_${userId}_` : 'misbah_';
    setStoragePrefix(prefix);
  }, [userId]);
  const [audioSurah, setAudioSurah] = useState(1);
  const [audioVerse, setAudioVerseState] = useState<number | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioPlayMode, setAudioPlayMode] = useState<'surah' | 'verse'>('verse');
  const [audioTotalVerses, setAudioTotalVerses] = useState(0);
  const [audioWords, setAudioWordsState] = useState<Word[]>([]);
  const [audioHighlightedWord, setAudioHighlightedWordState] = useState<{ verse: number; wordIndex: number } | null>(null);

  const playVerseAudio = useCallback((surahId: number, verseNum: number, mode: 'surah' | 'verse', totalVerses: number, words: Word[]) => {
    setAudioSurah(surahId);
    setAudioVerseState(verseNum);
    setAudioPlayMode(mode);
    setAudioTotalVerses(totalVerses);
    setAudioWordsState(words);
    setAudioHighlightedWordState(null);
    setShowAudioPlayer(true);
  }, []);

  const stopAudio = useCallback(() => {
    setAudioVerseState(null);
    setShowAudioPlayer(false);
    setAudioWordsState([]);
    setAudioHighlightedWordState(null);
  }, []);

  const setAudioVerse = useCallback((verse: number) => {
    setAudioVerseState(verse);
  }, []);

  const setAudioWords = useCallback((words: Word[]) => {
    setAudioWordsState(words);
  }, []);

  const setAudioHighlightedWord = useCallback((w: { verse: number; wordIndex: number } | null) => {
    setAudioHighlightedWordState(w);
  }, []);

  const closeAudioPlayer = useCallback(() => {
    setShowAudioPlayer(false);
    setAudioVerseState(null);
    setAudioWordsState([]);
    setAudioHighlightedWordState(null);
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveToStorage('settings', next);
      return next;
    });
  }, []);

  const theme = settings.theme;
  const language = settings.language;
  const setTheme = useCallback((t: ThemeId) => updateSettings({ theme: t }), [updateSettings]);
  const setLanguage = useCallback((l: Language) => updateSettings({ language: l }), [updateSettings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [theme, language]);

  const setIsAuthenticated = useCallback((v: boolean) => {
    setIsAuthenticatedState(v);
    saveToStorage('isAuthenticated', v);
  }, []);

  const setUserName = useCallback((v: string) => {
    setUserNameState(v);
    saveToStorage('userName', v);
  }, []);

  const setAvatarUrl = useCallback((v: string) => {
    setAvatarUrlState(v);
    saveToStorage('avatarUrl', v);
  }, []);

  const reloadUserData = useCallback((uid: string) => {
    const p = `misbah_${uid}_`;
    const load = <T,>(k: string, fb: T): T => {
      try { const v = localStorage.getItem(`${p}${k}`); if (v) return JSON.parse(v); } catch {}
      return fb;
    };
    setSettings(load('settings', DEFAULT_SETTINGS));
    setBookmarks(load('bookmarks', []));
    setMemorization(load('memorization', []));
    setTasbihCounters(load('tasbih', []));
    const d = load<{ date: string; count: number }>('versesToday', { date: '', count: 0 });
    const today = new Date().toDateString();
    setVersesReadToday(d.date === today ? d.count : 0);
  }, []);

  useEffect(() => {
    getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const uid = session.user.id;
        setUserId(uid);
        migrateGuestToUser(`misbah_${uid}_`);
        setIsAuthenticatedState(true);
        saveToStorage('isAuthenticated', true);
        setUserEmail(session.user.email || '');
        const meta = session.user.user_metadata;
        if (meta?.name) {
          setUserNameState(meta.name);
          saveToStorage('userName', meta.name);
        }
        reloadUserData(uid);
        getProfile(uid).then(p => {
          if (p?.avatar_url) {
            setAvatarUrlState(p.avatar_url);
            saveToStorage('avatarUrl', p.avatar_url);
          }
        }).catch(() => {});
        getBookmarks(uid).then(bms => {
          if (bms && bms.length > 0) {
            const mapped = bms.map((b: any) => ({ surahId: b.surah_id, verseNumber: b.verse_number, note: b.note || '', timestamp: b.timestamp || Date.now() }));
            setBookmarks(mapped);
            saveToStorage('bookmarks', mapped);
          }
        }).catch(() => {});
      }
    }).catch(() => {});
    const { data: { subscription } } = onAuthChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const uid = session.user.id;
        setUserId(uid);
        migrateGuestToUser(`misbah_${uid}_`);
        setIsAuthenticatedState(true);
        saveToStorage('isAuthenticated', true);
        setUserEmail(session.user.email || '');
        const meta = session.user.user_metadata;
        if (meta?.name) {
          setUserNameState(meta.name);
          saveToStorage('userName', meta.name);
        }
        reloadUserData(uid);
        getProfile(uid).then(p => {
          if (p?.avatar_url) {
            setAvatarUrlState(p.avatar_url);
            saveToStorage('avatarUrl', p.avatar_url);
          }
          if (p?.name) {
            setUserNameState(p.name);
            saveToStorage('userName', p.name);
          }
        }).catch(() => {});
        getBookmarks(uid).then(bms => {
          if (bms && bms.length > 0) {
            const mapped = bms.map((b: any) => ({ surahId: b.surah_id, verseNumber: b.verse_number, note: b.note || '', timestamp: b.timestamp || Date.now() }));
            setBookmarks(mapped);
            saveToStorage('bookmarks', mapped);
          }
        }).catch(() => {});
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setIsAuthenticatedState(false);
        saveToStorage('isAuthenticated', false);
        setUserNameState('');
        saveToStorage('userName', '');
        setUserEmail('');
        setSettings(loadFromStorage('settings', DEFAULT_SETTINGS));
        setBookmarks(loadFromStorage('bookmarks', []));
        setMemorization(loadFromStorage('memorization', []));
        setTasbihCounters(loadFromStorage('tasbih', []));
        const d = loadFromStorage<{ date: string; count: number }>('versesToday', { date: '', count: 0 });
        const today = new Date().toDateString();
        setVersesReadToday(d.date === today ? d.count : 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [reloadUserData]);

  useEffect(() => {
    const loc = userLocation || { city: 'Makkah', lat: 21.4225, lon: 39.8262 };
    if (!userLocation) setUserLocation(loc);
    fetchPrayerTimes(loc.lat, loc.lon).then(setPrayerTimes).catch(() => {});
  }, []);

  useEffect(() => {
    const today = new Date().toDateString();
    if (versesReadToday > 0) {
      saveToStorage('versesToday', { date: today, count: versesReadToday });
    }
  }, [versesReadToday]);

  const incrementVersesRead = useCallback(() => setVersesReadToday(prev => prev + 1), []);

  const addBookmark = useCallback((b: Bookmark) => {
    setBookmarks(prev => {
      const exists = prev.find(bm => bm.surahId === b.surahId && bm.verseNumber === b.verseNumber);
      if (exists) return prev;
      const next = [...prev, b];
      saveToStorage('bookmarks', next);
      if (userId) syncBookmarks(userId, next).catch(() => {});
      return next;
    });
  }, [userId]);

  const removeBookmark = useCallback((surahId: number, verseNumber: number) => {
    setBookmarks(prev => {
      const next = prev.filter(b => !(b.surahId === surahId && b.verseNumber === verseNumber));
      saveToStorage('bookmarks', next);
      if (userId) syncBookmarks(userId, next).catch(() => {});
      return next;
    });
  }, [userId]);

  const updateMemorization = useCallback((surahId: number, hiddenWords: number[]) => {
    setMemorization(prev => {
      const existing = prev.findIndex(m => m.surahId === surahId);
      let next: MemorizationProgress[];
      if (existing >= 0) {
        next = [...prev];
        next[existing] = { surahId, hiddenWords };
      } else {
        next = [...prev, { surahId, hiddenWords }];
      }
      saveToStorage('memorization', next);
      return next;
    });
  }, []);

  const updateTasbihCounter = useCallback((id: string, count: number) => {
    setTasbihCounters(prev => {
      const next = prev.map(c => c.id === id ? { ...c, count } : c);
      saveToStorage('tasbih', next);
      return next;
    });
  }, []);

  const resetTasbihCounter = useCallback((id: string) => {
    setTasbihCounters(prev => {
      const next = prev.map(c => c.id === id ? { ...c, count: 0 } : c);
      saveToStorage('tasbih', next);
      return next;
    });
  }, []);

  const tFn = useCallback((key: string): string => {
    if (!translations[language]) return key;
    return (translations[language] as any)[key] || key;
  }, [language]);

  const value: AppContextType = {
    settings, updateSettings, theme, setTheme, language, setLanguage,
    t: tFn, bookmarks, addBookmark, removeBookmark,
    memorization, updateMemorization,
    tasbihCounters, updateTasbihCounter, resetTasbihCounter,
    versesReadToday, incrementVersesRead,
    prayerTimes, setPrayerTimes, userLocation, setUserLocation: handleSetUserLocation,
    isAuthenticated, setIsAuthenticated, userName, setUserName, avatarUrl, setAvatarUrl, userEmail, userId,
    audioSurah, audioVerse, showAudioPlayer, audioPlayMode, audioTotalVerses, audioWords, audioHighlightedWord,
    playVerseAudio, stopAudio, setAudioSurah, setAudioVerse, setAudioWords, setAudioHighlightedWord, closeAudioPlayer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
