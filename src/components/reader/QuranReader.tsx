import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Search, X, LayoutList, Columns2, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SURAHS } from '../../data/surahs';
import { fetchVersesByChapter, getFallbackVerses, getWordAudioUrl, fetchTafsir } from '../../services/quranApi';
import WordByWordDisplay from './WordByWordDisplay';
import SettingsPanel from './SettingsPanel';
import type { Verse, Bookmark as BookmarkType } from '../../types';

function toArabicNumeral(num: number): string {
  return num.toString().split('').map(d => String.fromCharCode(0x0660 + parseInt(d))).join('');
}

export default function QuranReader() {
  const navigate = useNavigate();
  const { surahId } = useParams<{ surahId?: string }>();
  const { settings, updateSettings, bookmarks, addBookmark, removeBookmark, incrementVersesRead, t, language, playVerseAudio, audioSurah, audioVerse, audioHighlightedWord, setAudioWords, closeAudioPlayer } = useApp();
  const { lastSurah, lastVerse, displayMode } = settings;
  const initialSurah = surahId ? Math.min(114, Math.max(1, parseInt(surahId, 10) || 1)) : lastSurah;
  const [currentSurah, setCurrentSurah] = useState(initialSurah);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSurahList, setShowSurahList] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTafsir, setExpandedTafsir] = useState<Set<number>>(new Set());
  const [tafsirTexts, setTafsirTexts] = useState<Record<number, string>>({});
  const [tafsirLoading, setTafsirLoading] = useState<Set<number>>(new Set());
  const mainRef = useRef<HTMLDivElement>(null);

  const surahInfo = SURAHS[currentSurah - 1];
  const loadVerses = useCallback(async (surahId: number, pageNum: number, append: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVersesByChapter(surahId, pageNum, 20);
      setVerses((prev) => (append ? [...prev, ...data.verses] : data.verses));
      setTotalPages(data.pagination.total_pages);
      if (!append && data.verses.length > 0) {
        updateSettings({ lastVerse: data.verses[0].verse_number });
      }
    } catch {
      try {
        const fallback = getFallbackVerses(surahId, 20);
        if (fallback.length > 0) {
          setVerses(fallback);
          setTotalPages(1);
          updateSettings({ lastVerse: 1 });
        } else {
          throw new Error('No fallback data');
        }
      } catch {
        setError('Failed to load verses. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const prevSurahRef = useRef(currentSurah);

  // Sync currentSurah when URL param changes (e.g. via AudioPlayer shuffle)
  useEffect(() => {
    if (surahId) {
      const parsed = Math.min(114, Math.max(1, parseInt(surahId, 10) || 1));
      if (parsed !== currentSurah) {
        setCurrentSurah(parsed);
      }
    }
  }, [surahId]);

  useEffect(() => {
    const prevSurah = prevSurahRef.current;
    prevSurahRef.current = currentSurah;
    setVerses([]);
    setPage(1);
    setTotalPages(1);
    if (currentSurah !== prevSurah && audioSurah !== currentSurah) {
      closeAudioPlayer();
    }
    loadVerses(currentSurah, 1);
    updateSettings({ lastSurah: currentSurah });
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [currentSurah, loadVerses, updateSettings, closeAudioPlayer, audioSurah]);

  useEffect(() => {
    if (verses.length > 0 && !error) incrementVersesRead();
  }, [verses.length, error, incrementVersesRead]);

  useEffect(() => {
    setExpandedTafsir(new Set());
    setTafsirTexts({});
  }, [language]);

  const loadMore = () => {
    if (page < totalPages) {
      const next = page + 1;
      setPage(next);
      loadVerses(currentSurah, next, true);
      const lastLoaded = verses[verses.length - 1];
      if (lastLoaded) updateSettings({ lastVerse: lastLoaded.verse_number });
    }
  };

  const isBookmarked = (surahId: number, verseNum: number) =>
    bookmarks.some((b) => b.surahId === surahId && b.verseNumber === verseNum);

  const toggleBookmark = (verseNum: number) => {
    if (isBookmarked(currentSurah, verseNum)) {
      removeBookmark(currentSurah, verseNum);
    } else {
      addBookmark({ surahId: currentSurah, verseNumber: verseNum, note: '', timestamp: Date.now() });
    }
  };

  const filteredSurahs = SURAHS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.arabic.includes(searchQuery) ||
      s.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.id).includes(searchQuery)
  );

  const handlePlayVerse = (verseNum: number, mode: 'surah' | 'verse' = 'verse') => {
    const foundVerse = verses.find((v) => v.verse_number === verseNum);
    playVerseAudio(currentSurah, verseNum, mode, surahInfo?.verses || 0, foundVerse?.words || []);
  };

  // Update context words when audioVerse changes (for auto-advance)
  useEffect(() => {
    if (audioVerse === null) return;
    const found = verses.find((v) => v.verse_number === audioVerse);
    if (found) setAudioWords(found.words);
  }, [audioVerse, verses, setAudioWords]);

  return (
    <>
      {/* Surah List Modal */}
      <AnimatePresence>
        {showSurahList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowSurahList(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('surahList')}</span>
                </div>
                <button onClick={() => setShowSurahList(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="px-4 py-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchSurah')}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto px-2 pb-2 space-y-0.5">
                {filteredSurahs.map((surah) => {
                  const isActive = currentSurah === surah.id;
                  return (
                    <button
                      key={surah.id}
                      onClick={() => { setCurrentSurah(surah.id); setShowSurahList(false); navigate(`/quran/${surah.id}`); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={{
                        background: isActive ? 'var(--accent-bg)' : 'transparent',
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: isActive ? 'var(--accent)' : 'var(--bg-navbar)',
                          color: isActive ? 'white' : 'var(--text-muted)',
                        }}
                      >
                        {surah.id}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{surah.name}</span>
                          {surah.revelation === 'Mecca' ? (
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 100 100" style={{ fill: '#b8860b' }}>
                              <path d="M4.53,81.42l45,15s0,0,0,0c.15,.05,.31,.08,.47,.08s.32-.03,.47-.08c0,0,0,0,0,0l45-15c.61-.2,1.03-.78,1.03-1.42V20c0-.14-.03-.28-.07-.42-.01-.04-.03-.08-.04-.12-.04-.09-.08-.18-.14-.27-.02-.04-.04-.07-.07-.11-.07-.1-.16-.18-.25-.26-.02-.01-.03-.03-.04-.04,0,0,0,0,0,0-.11-.08-.24-.14-.37-.19-.01,0-.02-.01-.03-.02L50.47,3.58c-.31-.1-.64-.1-.95,0L4.53,18.58s-.02,.01-.03,.02c-.13,.05-.25,.11-.37,.19,0,0,0,0,0,0-.02,.01-.03,.03-.04,.04-.1,.08-.18,.16-.25,.26-.03,.03-.05,.07-.07,.11-.06,.09-.1,.17-.14,.27-.02,.04-.03,.08-.04,.12-.04,.14-.07,.28-.07,.42v60c0,.65,.41,1.22,1.03,1.42Zm35.96,8.82l-11.49-3.84v-25.17l11.49,3.84v25.17Zm8.01-40.41v4.34L6.5,40.17v-4.34l42,14Zm45-9.66l-42,14v-4.34l42-14v4.34Zm-43.5-6.75L9.74,20,50,6.58l40.26,13.42-40.26,13.42Z" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 shrink-0" viewBox="-5 -10 110 110" style={{ fill: '#1e6b4c' }}>
                              <path d="m80.699 69.102c0-14.699-22.898-30.699-29.199-34.699v-5.6992-0.10156c3.6016-0.39844 6.5-2.8008 7.8008-6-1.1016 0.39844-2.3008 0.69922-3.6016 0.69922-5.3008 0-9.6992-4.3984-9.6992-9.6992 0-1.3008 0.19922-2.5 0.69922-3.6016-3.6016 1.3984-6.1016 4.8984-6.1016 9 0 4.6992 3.3984 8.6016 7.8984 9.5v0.19922 5.6992c-6.1992 4.1016-29.199 20.102-29.199 34.699 0 3.8008 0.69922 7.5 2 10.898h-8.6016l0.003907 10.004h74.602v-10.102h-8.6016c1.3008-3.2969 2-7 2-10.797z" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {surah.translation} · {surah.verses} {language === 'ar' ? 'آية' : 'verses'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-arabic text-right leading-tight" style={{ color: 'var(--accent)' }}>{surah.arabic}</span>
                        {isActive && (
                          <Check size={16} style={{ color: 'var(--accent)' }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main ref={mainRef} className="max-w-4xl mx-auto px-4 pt-20 pb-24">
        {/* Surah Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-6 border"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
          }}
          dir="ltr"
        >
          <div className="px-6 py-8">
            {/* Top row: navigation */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button onClick={() => currentSurah > 1 && setCurrentSurah(currentSurah - 1)}
                className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}
                disabled={currentSurah <= 1}>
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => { setSearchQuery(''); setShowSurahList(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
              >
                <BookOpen size={12} />
                {t('surah')} {currentSurah} / 114
              </button>
              <button onClick={() => currentSurah < 114 && setCurrentSurah(currentSurah + 1)}
                className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}
                disabled={currentSurah >= 114}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Revelation type — centered */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {surahInfo?.revelation === 'Mecca' ? (
                <svg className="w-5 h-5" viewBox="0 0 100 100" style={{ fill: '#b8860b' }}>
                  <path d="M4.53,81.42l45,15s0,0,0,0c.15,.05,.31,.08,.47,.08s.32-.03,.47-.08c0,0,0,0,0,0l45-15c.61-.2,1.03-.78,1.03-1.42V20c0-.14-.03-.28-.07-.42-.01-.04-.03-.08-.04-.12-.04-.09-.08-.18-.14-.27-.02-.04-.04-.07-.07-.11-.07-.1-.16-.18-.25-.26-.02-.01-.03-.03-.04-.04,0,0,0,0,0,0-.11-.08-.24-.14-.37-.19-.01,0-.02-.01-.03-.02L50.47,3.58c-.31-.1-.64-.1-.95,0L4.53,18.58s-.02,.01-.03,.02c-.13,.05-.25,.11-.37,.19,0,0,0,0,0,0-.02,.01-.03,.03-.04,.04-.1,.08-.18,.16-.25,.26-.03,.03-.05,.07-.07,.11-.06,.09-.1,.17-.14,.27-.02,.04-.03,.08-.04,.12-.04,.14-.07,.28-.07,.42v60c0,.65,.41,1.22,1.03,1.42Zm35.96,8.82l-11.49-3.84v-25.17l11.49,3.84v25.17Zm8.01-40.41v4.34L6.5,40.17v-4.34l42,14Zm45-9.66l-42,14v-4.34l42-14v4.34Zm-43.5-6.75L9.74,20,50,6.58l40.26,13.42-40.26,13.42Z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="-5 -10 110 110" style={{ fill: '#1e6b4c' }}>
                  <path d="m80.699 69.102c0-14.699-22.898-30.699-29.199-34.699v-5.6992-0.10156c3.6016-0.39844 6.5-2.8008 7.8008-6-1.1016 0.39844-2.3008 0.69922-3.6016 0.69922-5.3008 0-9.6992-4.3984-9.6992-9.6992 0-1.3008 0.19922-2.5 0.69922-3.6016-3.6016 1.3984-6.1016 4.8984-6.1016 9 0 4.6992 3.3984 8.6016 7.8984 9.5v0.19922 5.6992c-6.1992 4.1016-29.199 20.102-29.199 34.699 0 3.8008 0.69922 7.5 2 10.898h-8.6016l0.003907 10.004h74.602v-10.102h-8.6016c1.3008-3.2969 2-7 2-10.797z" />
                </svg>
              )}
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {surahInfo?.revelation === 'Mecca' ? 'Makki' : 'Madani'}
              </span>
            </div>

            {/* Arabic name — centered */}
            <div className="text-center mb-5">
              <h1 className="font-arabic text-4xl sm:text-5xl font-bold leading-tight" style={{ color: 'var(--accent)' }}>
                {surahInfo?.arabic}
              </h1>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
              <button onClick={() => toggleBookmark(1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-70"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {isBookmarked(currentSurah, 1) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isBookmarked(currentSurah, 1) ? (language === 'ar' ? 'محفوظ' : 'Saved') : (language === 'ar' ? 'حفظ' : 'Save')}
              </button>
              <button onClick={() => handlePlayVerse(1, 'surah')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent)', color: 'white' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                {language === 'ar' ? 'تشغيل السورة' : 'Play Surah'}
              </button>
              <button onClick={() => updateSettings({ showVerseTranslation: !settings.showVerseTranslation })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-70"
                style={{
                  borderColor: settings.showVerseTranslation ? '#b8860b' : 'var(--border)',
                  background: settings.showVerseTranslation ? '#b8860b12' : 'transparent',
                  color: settings.showVerseTranslation ? '#b8860b' : 'var(--text-muted)',
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                {language === 'ar' ? 'الترجمة' : 'Translation'}
              </button>
              <button onClick={() => updateSettings({ displayMode: displayMode === 'normal' ? 'continuous' : 'normal' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-70"
                style={{
                  borderColor: displayMode === 'continuous' ? '#b8860b' : 'var(--border)',
                  background: displayMode === 'continuous' ? '#b8860b12' : 'transparent',
                  color: displayMode === 'continuous' ? '#b8860b' : 'var(--text-muted)',
                }}>
                {displayMode === 'continuous' ? <Columns2 size={14} /> : <LayoutList size={14} />}
                {displayMode === 'continuous'
                  ? (language === 'ar' ? 'آية آية' : 'Verse by Verse')
                  : (language === 'ar' ? 'مستمر' : 'Continuous')}
              </button>
            </div>

            {/* English name + translation + verses — centered */}
            <div className="text-center">
              <p className="text-lg font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{surahInfo?.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {surahInfo?.translation} · {surahInfo?.verses} {t('verses')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bismillah */}
        {currentSurah !== 9 && currentSurah !== 1 && (
          <div className="rounded-2xl border py-6 px-4 mb-6 text-center"
            style={{ background: 'var(--accent-bg)', borderColor: 'var(--border)' }}>
            <p className="font-arabic text-3xl sm:text-4xl leading-loose" style={{ color: 'var(--accent)' }} dir="rtl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{
              borderColor: 'var(--border)',
              borderTopColor: 'var(--accent)',
            }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border p-6 text-center" style={{
            background: 'var(--error-bg)',
            borderColor: 'var(--error)',
            color: 'var(--error)',
          }}>
            <p className="font-medium mb-2">{error}</p>
            <button
              onClick={() => loadVerses(currentSurah, 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              {t('tryAgain')}
            </button>
          </div>
        )}

        {/* Continuous Mode — like mushaf page */}
        {!loading && displayMode === 'continuous' && (
          <div
            className="rounded-2xl border overflow-hidden mb-6"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="px-4 py-8 sm:px-8 sm:py-10 flex justify-center"
              dir="rtl"
            >
              <div
                className="w-full max-w-2xl"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'baseline',
                  gap: '0.25rem 0.5rem',
                  lineHeight: '4rem',
                }}
              >
                  {verses.map((verse) => {
                    const words = verse.words.filter(
                      (w) =>
                        w.char_type_name === 'word'
                    );

                  return (
                    <span
                      key={verse.verse_key}
                      style={{
                        display: 'contents',
                      }}
                    >
                      {words.map((word, wi) => {
                        const highlighted =
                          audioHighlightedWord?.verse ===
                          verse.verse_number &&
                          audioHighlightedWord.wordIndex === wi;

                        const isEnd =
                          word.char_type_name === 'end';

                        const wordColor = isEnd
                          ? 'var(--text-muted)'
                          : highlighted
                            ? 'var(--accent)'
                            : 'var(--text-primary)';

                        return (
                          <div
                            key={word.id}
                            role="button"
                            tabIndex={0}
                            data-word-location={`${currentSurah}:${verse.verse_number}:${wi + 1}`}
                            onClick={() => {
                              if (word.audio_url) {
                                const audio = new Audio(
                                  getWordAudioUrl(word.audio_url)
                                );

                                audio.play().catch(() => { });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (
                                (e.key === 'Enter' ||
                                  e.key === ' ') &&
                                word.audio_url
                              ) {
                                e.preventDefault();

                                const audio = new Audio(
                                  getWordAudioUrl(word.audio_url)
                                );

                                audio.play().catch(() => { });
                              }
                            }}
                            className={`
                      inline-flex
                      items-baseline
                      cursor-pointer
                      select-none
                      rounded-md
                      transition-all
                      duration-200
                      hover:opacity-70
                    `}
                            style={{
                              background: highlighted
                                ? 'var(--accent-bg)'
                                : 'transparent',
                            }}
                          >
                            <span
                              data-font-scale="4"
                              className="inline"
                              style={{
                                fontFamily: 'var(--font-arabic)',
                                fontSize: '2.8rem',
                                lineHeight: '4rem',
                                color: wordColor,
                              }}
                            >
                              {word.text_uthmani?.replace(/[\u06DD\u06DE][\u0660-\u0669]*$/, '') || word.text?.replace(/[\u06DD\u06DE][\u0660-\u0669]*$/, '')}
                            </span>
                          </div>
                        );
                      })}

                      {/* Ayah ornament */}
                      <span className="inline-flex items-center justify-center relative mx-2 translate-y-1 select-none">
                        <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M24 2 C27 5 31 7 36 7 C41 7 43 11 43 16 C43 21 45 24 46 24 C45 24 43 27 43 32 C43 37 41 41 36 41 C31 41 27 43 24 46 C21 43 17 41 12 41 C7 41 5 37 5 32 C5 27 3 24 2 24 C3 24 5 21 5 16 C5 11 7 7 12 7 C17 7 21 5 24 2"
                            stroke="var(--accent)" strokeWidth="1.8" fill="transparent"/>
                          <circle cx="24" cy="24" r="13" stroke="var(--accent)" strokeWidth="1.3" fill="transparent"/>
                          <path d="M18 9C19 11 21 12 24 12C27 12 29 11 30 9" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
                          <path d="M18 39C19 37 21 36 24 36C27 36 29 37 30 39" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
                          <path d="M9 18C11 19 12 21 12 24C12 27 11 29 9 30" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
                          <path d="M39 18C37 19 36 21 36 24C36 27 37 29 39 30" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                        <span className="absolute text-[15px] font-bold leading-none" style={{ color: 'var(--accent)', fontFamily: 'var(--font-arabic)' }}>
                          {toArabicNumeral(verse.verse_number)}
                        </span>
                      </span>

                      {/* Translation */}
                      {settings.showVerseTranslation &&
                        verse.translations?.[0]?.text && (
                          <span className="w-full text-left mt-1 mb-2">
                            <span
                              className="text-sm leading-relaxed"
                              style={{
                                color:
                                  'var(--text-secondary)',
                              }}
                            >
                              ({verse.verse_number}){' '}
                              {verse.translations[0].text.replace(
                                /<[^>]*>/g,
                                ''
                              )}
                            </span>
                          </span>
                        )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div
              className="flex items-center justify-between px-5 py-3 border-t"
              style={{
                borderColor: 'var(--border-light)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                  }}
                >
                  {verses.length} {t('verses')}
                </span>

                <button
                  onClick={() =>
                    handlePlayVerse(
                      verses[0]?.verse_number,
                      'surah'
                    )
                  }
                  className="
            flex
            items-center
            gap-1.5
            px-4
            py-2
            rounded-lg
            text-xs
            font-semibold
            border
            transition-all
          "
                  style={{
                    borderColor: 'var(--accent)',
                    background: 'var(--accent)',
                    color: 'white',
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>

                  {t('play')}
                </button>
              </div>

              <button
                onClick={() =>
                  updateSettings({
                    showVerseTranslation:
                      !settings.showVerseTranslation,
                  })
                }
                className="
          text-xs
          font-medium
          px-3
          py-1.5
          rounded-lg
          border
          transition-all
        "
                style={{
                  borderColor:
                    settings.showVerseTranslation
                      ? '#b8860b'
                      : 'var(--border)',

                  color:
                    settings.showVerseTranslation
                      ? '#b8860b'
                      : 'var(--text-muted)',
                }}
              >
                {settings.showVerseTranslation
                  ? language === 'ar'
                    ? 'ترجمة'
                    : 'Trans.'
                  : language === 'ar'
                    ? 'إظهار'
                    : 'Show'}
              </button>
            </div>
          </div>
        )}

        {!loading && displayMode === 'normal' && verses.map((verse) => (
          <motion.div
            key={verse.verse_key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border mb-5 overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Words area */}
            <div
  className="px-5 pt-5 pb-3 flex flex-wrap t  justify-start gap-x-2 gap-y-3"
  dir="rtl"
>
              <WordByWordDisplay
                words={verse.words}
                verseKey={verse.verse_key}
                highlightWordIndex={audioHighlightedWord?.verse === verse.verse_number ? audioHighlightedWord.wordIndex : undefined}
              />
              {/* Verse number in Arabic */}
              <div className="flex justify-end mt-3">
                <span>
                  <span className="inline-flex items-center justify-center relative mx-2 translate-y-1">
                    {/* Ornament */}
                    <svg
                      viewBox="0 0 48 48"
                      className="w-11 h-11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Outer Ornament */}
                      <path
                        d="
                      M24 2
                      C27 5 31 7 36 7
                      C41 7 43 11 43 16
                      C43 21 45 24 46 24
                      C45 24 43 27 43 32
                      C43 37 41 41 36 41
                      C31 41 27 43 24 46
                      C21 43 17 41 12 41
                      C7 41 5 37 5 32
                      C5 27 3 24 2 24
                      C3 24 5 21 5 16
                      C5 11 7 7 12 7
                      C17 7 21 5 24 2
                    "
                        stroke="var(--accent)"
                        strokeWidth="1.8"
                        fill="transparent"
                      />

                      {/* Inner Circle */}
                      <circle
                        cx="24"
                        cy="24"
                        r="13"
                        stroke="var(--accent)"
                        strokeWidth="1.3"
                        fill="transparent"
                      />

                      {/* Top Decoration */}
                      <path
                        d="M18 9C19 11 21 12 24 12C27 12 29 11 30 9"
                        stroke="var(--accent)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />

                      {/* Bottom Decoration */}
                      <path
                        d="M18 39C19 37 21 36 24 36C27 36 29 37 30 39"
                        stroke="var(--accent)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />

                      {/* Left Decoration */}
                      <path
                        d="M9 18C11 19 12 21 12 24C12 27 11 29 9 30"
                        stroke="var(--accent)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />

                      {/* Right Decoration */}
                      <path
                        d="M39 18C37 19 36 21 36 24C36 27 37 29 39 30"
                        stroke="var(--accent)"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Ayah Number */}
                    <span
                      className="
                    absolute
                    text-[15px]
                    font-bold
                    leading-none
                  "
                      style={{
                        color: 'var(--accent)',
                        fontFamily:
                          'var(--font-arabic)',
                      }}
                    >
                      {toArabicNumeral(verse.verse_number)}
                    </span>
                    </span>
                  </span>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between px-3 sm:px-5 py-2 border-t gap-1" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <button
                  onClick={() => toggleBookmark(verse.verse_number)}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: isBookmarked(currentSurah, verse.verse_number) ? 'var(--accent)' : 'var(--text-muted)' }}
                  title={isBookmarked(currentSurah, verse.verse_number) ? 'Bookmarked' : 'Bookmark'}
                >
                  {isBookmarked(currentSurah, verse.verse_number) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </button>
                <button
                  onClick={async () => {
                    const vn = verse.verse_number;
                    const tafsirId = language === 'ar' ? 16 : 817;
                    const key = `${tafsirId}-${vn}`;
                    if (expandedTafsir.has(vn)) {
                      const next = new Set(expandedTafsir);
                      next.delete(vn);
                      setExpandedTafsir(next);
                      return;
                    }
                    setExpandedTafsir(prev => new Set(prev).add(vn));
                    if (!tafsirTexts[key]) {
                      setTafsirLoading(prev => new Set(prev).add(vn));
                      try {
                        const text = await fetchTafsir(currentSurah, vn, tafsirId);
                        setTafsirTexts(prev => ({ ...prev, [key]: text }));
                      } catch {
                        setTafsirTexts(prev => ({ ...prev, [key]: t('tafsirUnavailable') }));
                      } finally {
                        setTafsirLoading(prev => { const s = new Set(prev); s.delete(vn); return s; });
                      }
                    }
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all flex-shrink-0"
                  style={{
                    background: 'var(--accent-bg)',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                  }}
                >
                  <BookOpen size={12} />
                  {expandedTafsir.has(verse.verse_number) ? (tafsirLoading.has(verse.verse_number) ? '...' : t('hide')) : t('tafsir')}
                </button>
                <span className="text-[9px] sm:text-[10px] px-1 sm:px-2 truncate flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {t('juz')} {verse.juz_number} · {t('page')} {verse.page_number}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateSettings({ showVerseTranslation: !settings.showVerseTranslation })}
                  className="text-[10px] font-medium px-2 py-1 rounded-lg border transition-all"
                  style={{
                    borderColor: settings.showVerseTranslation ? '#b8860b' : 'var(--border)',
                    color: settings.showVerseTranslation ? '#b8860b' : 'var(--text-muted)',
                  }}
                >
                  {settings.showVerseTranslation ? (language === 'ar' ? 'ترجمة' : 'Trans.') : (language === 'ar' ? 'إظهار' : 'Show')}
                </button>
              </div>
            </div>

            {/* Full verse translation */}
            {settings.showVerseTranslation && verse.translations?.[0]?.text && (
              <div className="px-5 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    The Clear Quran (Mustafa Khattab)
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {verse.translations[0].text.replace(/<[^>]*>/g, '')}
                </p>
              </div>
            )}

            {/* Inline tafsir */}
            {expandedTafsir.has(verse.verse_number) && (
              <div className="px-5 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={12} />
                  <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                    {t('tafsir')} — {verse.verse_key}
                  </span>
                </div>
                {tafsirLoading.has(verse.verse_number) ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                    />
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-inherit [&_p]:mb-2 [&_p]:leading-relaxed prose prose-sm max-w-none"
                    style={{ color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: tafsirTexts[`${(language === 'ar' ? 16 : 817)}-${verse.verse_number}`] || '' }}
                  />
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Load More */}
        {!loading && !error && page < totalPages && (
          <div className="flex justify-center mt-4 mb-8">
            <button
              onClick={loadMore}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all text-white"
              style={{ background: 'var(--accent)' }}
            >
              <ChevronDown size={16} />
              {t('loadMore')} ({verses.length}/{surahInfo?.verses})
            </button>
          </div>
        )}

        {/* End */}
        {!loading && !error && verses.length > 0 && page >= totalPages && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              <BookOpen size={14} />
              {t('endOfSurah')} {surahInfo?.name}
            </div>
            {currentSurah < 114 && (
              <div className="mt-4">
                <button
                  onClick={() => setCurrentSurah(currentSurah + 1)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {t('nextSurah')}: {SURAHS[currentSurah]?.name} →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
