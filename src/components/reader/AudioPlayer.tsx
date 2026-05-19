import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Check, Loader, Repeat, Shuffle, ListMusic } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSurahAudioUrl, fetchSurahWords } from '../../services/quranApi';
import { getReciterById, getWorkingReciters, RECITERS, getReciterImageUrl } from '../../data/reciters-data';
import { SURAHS } from '../../data/surahs';
import type { Reciter, Word } from '../../types';

export default function AudioPlayer() {
  const navigate = useNavigate();
  const { settings, updateSettings, audioSurah, audioVerse, showAudioPlayer, audioPlayMode, audioTotalVerses, setAudioSurah, setAudioVerse, setAudioHighlightedWord, setAudioWords, closeAudioPlayer, language } = useApp();
  const { reciter } = settings;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showReciterList, setShowReciterList] = useState(false);
  const [showSurahList, setShowSurahList] = useState(false);
  const [loadingSurah, setLoadingSurah] = useState(true);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const surahWordsRef = useRef<Word[]>([]);
  const currentVerseRef = useRef(audioVerse);
  const isPlayingRef = useRef(false);
  const isRepeatRef = useRef(false);
  const isShuffleRef = useRef(false);
  const playModeRef = useRef(audioPlayMode);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  currentVerseRef.current = audioVerse;
  isPlayingRef.current = isPlaying;
  isRepeatRef.current = isRepeat;
  isShuffleRef.current = isShuffle;
  playModeRef.current = audioPlayMode;

  const reciterInfo = getReciterById(reciter);
  const surahInfo = useMemo(() => SURAHS.find((s) => s.id === audioSurah), [audioSurah]);
  const isRtl = language === 'ar';

  // Load the full surah words & start playback
  useEffect(() => {
    if (!audioVerse) return;
    let cancelled = false;

    async function init() {
      setLoadingSurah(true);
      try {
        const words = await fetchSurahWords(audioSurah);
        if (cancelled) return;
        surahWordsRef.current = words;

        const initialVerseWords = words.filter((w) => w.verse_number === audioVerse && (w.char_type_name === 'word' || w.char_type_name === 'end'));
        setAudioWords(initialVerseWords as Word[]);

        const url = getSurahAudioUrl(audioSurah, reciter);
        const audio = new Audio();
        audioRef.current = audio;

        audio.ontimeupdate = () => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
            setCurrentTime(audio.currentTime);
          }
          if (isPlayingRef.current) {
            trackWordPosition(audio.currentTime * 1000);
          }
        };

        audio.onloadedmetadata = () => {
          setDuration(audio.duration || 0);
        };

        audio.onended = () => {
          if (isShuffleRef.current) {
            const others = SURAHS.filter((s) => s.id !== audioSurah);
            const next = others[Math.floor(Math.random() * others.length)];
            setAudioSurah(next.id);
            navigate(`/quran/${next.id}`);
          } else if (isRepeatRef.current) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          } else {
            setIsPlaying(false);
            setProgress(0);
          }
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setAudioError(true);
        };

        audio.oncanplay = () => {
          setAudioError(false);
        };

        const startWord = words.find((w) => w.verse_number === audioVerse && w.audio_timestamp != null);
        audio.src = url;
        await audio.load();

        if (startWord?.audio_timestamp != null) {
          audio.currentTime = startWord.audio_timestamp / 1000;
        }

        await audio.play();
        if (!cancelled) {
          setIsPlaying(true);
          setLoadingSurah(false);
        }
      } catch {
        if (!cancelled) {
          setLoadingSurah(false);
          setIsPlaying(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSurah, reciter]);

  // Seek when the verse changes (e.g., clicking a different verse play button)
  useEffect(() => {
    if (!audioVerse || !audioRef.current || loadingSurah) return;
    const words = surahWordsRef.current;
    const targetWord = words.find((w) => w.verse_number === audioVerse && w.audio_timestamp != null);
    if (targetWord?.audio_timestamp != null) {
      audioRef.current.currentTime = targetWord.audio_timestamp / 1000;
      setAudioHighlightedWord({ verse: audioVerse, wordIndex: 0 });
      const verseWords = words.filter(
        (w) => w.verse_number === audioVerse && (w.char_type_name === 'word' || w.char_type_name === 'end')
      );
      setAudioWords(verseWords as Word[]);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioVerse]);

  const trackWordPosition = useCallback((currentMs: number) => {
    const words = surahWordsRef.current;
    if (words.length === 0) return;

    let wordIdx = -1;
    for (let i = 0; i < words.length; i++) {
      const ts = words[i].audio_timestamp;
      if (ts != null && ts <= currentMs + 50) {
        wordIdx = i;
      } else if (ts != null && ts > currentMs + 50) {
        break;
      }
    }

    if (wordIdx < 0) return;
    const currentWord = words[wordIdx];

    const verseNum = currentWord.verse_number;
    if (verseNum && verseNum !== currentVerseRef.current) {
      if (playModeRef.current === 'verse' && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        setProgress(100);
        return;
      }
      setAudioVerse(verseNum);
      const verseWords = words.filter(
        (w) => w.verse_number === verseNum && (w.char_type_name === 'word' || w.char_type_name === 'end')
      );
      setAudioWords(verseWords as Word[]);
    }

    if (verseNum) {
      const verseWordIdx = words
        .filter((w) => w.verse_number === verseNum && (w.char_type_name === 'word' || w.char_type_name === 'end'))
        .findIndex((w) => w.id === currentWord.id);
      if (verseWordIdx >= 0) {
        setAudioHighlightedWord({ verse: verseNum, wordIndex: verseWordIdx });
      }
    }
  }, [setAudioVerse, setAudioWords, setAudioHighlightedWord]);

  function formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioError) {
        setAudioError(false);
        audioRef.current.load();
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function seekToVerse(verseNum: number) {
    const words = surahWordsRef.current;
    const targetWord = words.find((w) => w.verse_number === verseNum && w.audio_timestamp != null);
    if (!audioRef.current || targetWord?.audio_timestamp == null) return;
    audioRef.current.currentTime = targetWord.audio_timestamp / 1000;
    setAudioVerse(verseNum);
    const verseWords = words.filter(
      (w) => w.verse_number === verseNum && (w.char_type_name === 'word' || w.char_type_name === 'end')
    );
    setAudioWords(verseWords as Word[]);
    setAudioHighlightedWord({ verse: verseNum, wordIndex: 0 });
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function prevSurah() {
    const nextId = audioSurah > 1 ? audioSurah - 1 : 114;
    setAudioSurah(nextId);
    navigate(`/quran/${nextId}`);
  }

  function nextSurah() {
    const nextId = audioSurah < 114 ? audioSurah + 1 : 1;
    setAudioSurah(nextId);
    navigate(`/quran/${nextId}`);
  }

  function toggleMute() {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function handleVolumeChange(e: React.MouseEvent<HTMLDivElement>) {
    const bar = volumeBarRef.current;
    if (!bar || !audioRef.current) return;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const v = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.volume = v;
    setVolume(v);
    if (v > 0 && isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const bar = progressBarRef.current;
    if (!bar || !audioRef.current || !audioRef.current.duration) return;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.currentTime = pct * audioRef.current.duration;
  }

  function switchReciter(id: string) {
    updateSettings({ reciter: id });
    setShowReciterList(false);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = '';
    }
    setIsPlaying(false);
    setProgress(0);
  }

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-2 md:p-4 pointer-events-none"
        dir="ltr"
      >
        <div
          className="w-full max-w-6xl pointer-events-auto rounded-xl md:rounded-2xl border px-3 py-2 md:px-6 md:py-5 shadow-2xl"
          style={{
            background: `color-mix(in srgb, var(--bg-navbar) 75%, transparent)`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: `color-mix(in srgb, var(--border) 40%, transparent)`,
          }}
        >
          {/* ── MOBILE LAYOUT (column) ── */}
          <div className="flex flex-col items-center gap-1.5 md:hidden w-full">
            {/* Row 1: Reciter avatar + surah info */}
            <div className="flex items-center justify-center gap-3 w-full px-1">
              <button onClick={() => setShowReciterList(true)} className="flex-shrink-0 cursor-pointer">
                <div className="w-12 h-12 rounded-full overflow-hidden" style={{ outline: '2px solid var(--accent)', outlineOffset: '2px' }}>
                  <img
                    src={reciterInfo ? getReciterImageUrl(reciterInfo, 96) : `https://ui-avatars.com/api/?name=${encodeURIComponent(reciter)}&background=b8860b&color=fff&size=96`}
                    alt={reciterInfo?.name || reciter}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
              <div className="flex flex-col items-center flex-1 min-w-0 text-center">
                <div className="flex items-center gap-2" dir="rtl">
                  {surahInfo && (
                    <>
                      <button onClick={() => setShowSurahList(true)} className="text-base font-bold cursor-pointer hover:opacity-70 transition-opacity truncate max-w-[140px]" style={{ color: 'var(--text-primary)', fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                        {surahInfo.arabic}
                      </button>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        {surahInfo.revelation === 'Mecca' ? 'مكية' : 'مدنية'}
                      </span>
                    </>
                  )}
                </div>
                {surahInfo && (
                  <span className="text-[10px] truncate max-w-full mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {surahInfo.name} · {surahInfo.translation}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Playback controls — centered, shuffle next to back */}
            <div className="flex items-center justify-center gap-3 w-full">
              <button onClick={() => setIsShuffle(!isShuffle)} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: isShuffle ? 'var(--accent)' : 'var(--text-muted)' }}>
                <Shuffle size={14} />
              </button>
              <button onClick={prevSurah} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <SkipBack size={15} />
              </button>
              <button onClick={togglePlay} disabled={loadingSurah} className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 cursor-pointer" style={{ background: 'var(--accent)', color: 'white', boxShadow: `0 0 16px ${loadingSurah ? 'transparent' : 'var(--accent)'}40` }}>
                {loadingSurah ? <Loader size={17} className="animate-spin" /> : isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={nextSurah} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <SkipForward size={15} />
              </button>
              <button onClick={() => setIsRepeat(!isRepeat)} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: isRepeat ? 'var(--accent)' : 'var(--text-muted)' }}>
                <Repeat size={14} />
              </button>
            </div>

            {/* Row 3: Mute icon + Progress */}
            <div className="flex items-center gap-1.5 w-full">
              <button onClick={toggleMute} className="p-1 rounded-full transition-all hover:scale-105 cursor-pointer shrink-0" style={{ color: 'var(--text-muted)' }}>
                {isMuted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              <span className="text-[8px] font-mono tabular-nums min-w-[20px] text-right" style={{ color: 'var(--text-muted)' }}>{formatTime(currentTime)}</span>
              <div ref={progressBarRef} onClick={handleSeek} className="flex-1 h-0.5 rounded-full cursor-pointer" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
              <span className="text-[8px] font-mono tabular-nums min-w-[20px]" style={{ color: 'var(--text-muted)' }}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* ── DESKTOP LAYOUT (row) ── */}
          <div className="hidden md:flex items-stretch gap-4 w-full min-w-0">
            {/* ── PROFILE CARD ── */}
            <div className="flex items-center gap-3 flex-shrink-0 min-w-0 max-w-[220px]">
              <button onClick={() => setShowReciterList(true)} className="relative flex-shrink-0 focus:outline-none cursor-pointer">
                <div className="w-16 h-16 rounded-full overflow-hidden" style={{ outline: `2.5px solid var(--accent)`, outlineOffset: '3px', boxShadow: `0 0 30px ${loadingSurah ? 'transparent' : 'var(--accent)'}50` }}>
                  <img src={reciterInfo ? getReciterImageUrl(reciterInfo, 128) : `https://ui-avatars.com/api/?name=${encodeURIComponent(reciter)}&background=b8860b&color=fff&size=128`} alt={reciterInfo?.name || reciter} className="w-full h-full object-cover" />
                </div>
                {isPlaying && !loadingSurah && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </motion.span>
                )}
              </button>

              <div className="min-w-0" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <div className="flex items-center gap-2 flex-wrap" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <p className="text-base font-bold truncate max-w-[130px]" style={{ color: 'var(--text-primary)' }}>
                    {reciterInfo?.name || reciter}
                  </p>
                  {isPlaying && !loadingSurah && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {language === 'ar' ? 'تشغيل' : 'Now Playing'}
                    </span>
                  )}
                </div>
                {reciterInfo?.arabicName && (
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'Traditional Arabic', 'Amiri', serif", textAlign: isRtl ? 'right' : 'left' }}>
                    {reciterInfo.arabicName}
                  </p>
                )}
                {surahInfo && (
                  <button onClick={() => setShowSurahList(true)} className="text-[11px] mt-0.5 truncate max-w-[180px] cursor-pointer hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                    {surahInfo.name} · <span className="text-[10px] px-1 py-0.5 rounded font-medium cursor-pointer" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {language === 'ar' ? (surahInfo.revelation === 'Mecca' ? 'مكية' : 'مدنية') : surahInfo.revelation}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* ── PLAYBACK CONTROLS — centered ── */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 justify-center px-2">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsShuffle(!isShuffle)} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: isShuffle ? 'var(--accent)' : 'var(--text-muted)' }}>
                  <Shuffle size={16} />
                </button>
                <button onClick={prevSurah} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  <SkipBack size={18} />
                </button>
                <button onClick={togglePlay} disabled={loadingSurah} className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 hover:scale-105 cursor-pointer" style={{ background: 'var(--accent)', color: 'white', boxShadow: `0 0 24px ${loadingSurah ? 'transparent' : 'var(--accent)'}60` }}>
                  {loadingSurah ? <Loader size={20} className="animate-spin" /> : isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={nextSurah} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  <SkipForward size={18} />
                </button>
                <button onClick={() => setIsRepeat(!isRepeat)} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: isRepeat ? 'var(--accent)' : 'var(--text-muted)' }}>
                  <Repeat size={16} />
                </button>
              </div>
              <div className="w-full flex items-center gap-2 max-w-md">
                <span className="text-xs font-mono tabular-nums min-w-[36px]" style={{ color: 'var(--text-muted)' }}>{formatTime(currentTime)}</span>
                <div ref={progressBarRef} onClick={handleSeek} className="flex-1 h-1.5 rounded-full cursor-pointer relative group" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%`, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', marginLeft: '-6px' }} />
                </div>
                <span className="text-xs font-mono tabular-nums min-w-[36px]" style={{ color: 'var(--text-muted)' }}>{formatTime(duration)}</span>
              </div>
            </div>

            {/* ── VOLUME & ACTIONS ── */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={toggleMute} className="p-1.5 rounded-full transition-all hover:scale-105 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div ref={volumeBarRef} onClick={handleVolumeChange} className="w-20 h-1.5 rounded-full cursor-pointer relative group" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%`, background: 'var(--accent)' }} />
              </div>
              <div className="w-px h-5" style={{ background: 'var(--border)' }} />
              <button onClick={() => setShowReciterList(true)} className="p-1.5 rounded-full transition-all hover:scale-105 focus:outline-none cursor-pointer" style={{ color: 'var(--text-muted)' }} title={language === 'ar' ? 'اختر القارئ' : 'Change Reciter'}>
                <div className="w-6 h-6 rounded-full overflow-hidden" style={{ outline: '1.5px solid var(--border)' }}>
                  <img src={reciterInfo ? getReciterImageUrl(reciterInfo, 28) : `https://ui-avatars.com/api/?name=${encodeURIComponent(reciter)}&background=b8860b&color=fff&size=28&bold=true`} alt={reciterInfo?.name || reciter} className="w-full h-full object-cover" />
                </div>
              </button>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Reciter Selection Modal ── */}
      <AnimatePresence>
        {showReciterList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowReciterList(false)}
            />

            {/* Modal */}
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
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? 'اختر القارئ' : 'Select Reciter'}
                </span>
                <button
                  onClick={() => setShowReciterList(false)}
                  className="p-1 rounded-full transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* List */}
              <div className="max-h-[50vh] overflow-y-auto">
                {getWorkingReciters().map((r: Reciter) => (
                  <button
                    key={r.id}
                    onClick={() => switchReciter(r.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-all cursor-pointer"
                    style={{
                      background: reciter === r.id ? 'var(--accent-bg)' : 'transparent',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                  >
                    <img
                      src={getReciterImageUrl(r, 40)}
                      alt={r.name}
                      className="flex-shrink-0 w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.country} · {r.style}</div>
                    </div>
                    {reciter === r.id && (
                      <Check size={16} style={{ color: 'var(--accent)' }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Surah List Modal ── */}
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
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? 'اختر السورة' : 'Select Surah'}
                </span>
                <button
                  onClick={() => setShowSurahList(false)}
                  className="p-1 rounded-full transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                {SURAHS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setAudioSurah(s.id);
                      setShowSurahList(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-all cursor-pointer"
                    style={{
                      background: audioSurah === s.id ? 'var(--accent-bg)' : 'transparent',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: audioSurah === s.id ? 'var(--accent)' : 'var(--bg-navbar)',
                        color: audioSurah === s.id ? 'white' : 'var(--text-muted)',
                      }}>
                      {s.id}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                        {s.revelation === 'Mecca' ? (
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
                        {s.translation} · {s.verses} {language === 'ar' ? 'آية' : 'verses'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-arabic text-right leading-tight" style={{ color: 'var(--accent)' }}>{s.arabic}</span>
                      {audioSurah === s.id && (
                        <Check size={16} style={{ color: 'var(--accent)' }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
