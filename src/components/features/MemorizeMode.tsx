import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Mic, Square, Loader, Check, X, History, GraduationCap } from 'lucide-react';
import { useApp, getStorageKey } from '../../context/AppContext';
import { SURAHS } from '../../data/surahs';
import { fetchSurahWords, getFallbackVerses } from '../../services/quranApi';
import { transcribeRecitation, gradeRecitation, type RecitationGrade } from '../../services/recitationApi';
import { syncRecitation } from '../../services/supabase';
import type { Verse, Word, RecitationAttempt } from '../../types';

type Mode = 'study' | 'recite';
type RecordStatus = 'idle' | 'recording' | 'processing' | 'error';

const recorderSupported = typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
}

function loadAttempts(): RecitationAttempt[] {
  try {
    const raw = localStorage.getItem(getStorageKey('recitationAttempts'));
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export default function MemorizeMode() {
  const { language, isAuthenticated, userId } = useApp();
  const isAr = language === 'ar';
  const [mode, setMode] = useState<Mode>('recite');
  const [currentSurah, setCurrentSurah] = useState(1);
  const [words, setWords] = useState<Word[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  // Study mode (word-by-word hiding)
  const [currentVerseIdx, setCurrentVerseIdx] = useState(0);
  const [hiddenWords, setHiddenWords] = useState<Record<string, boolean>>({});
  const [hideAll, setHideAll] = useState(false);

  // Recite mode (Tareel-style hidden page)
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(10);
  const [hidePage, setHidePage] = useState(true);
  const [status, setStatus] = useState<RecordStatus>('idle');
  const [grade, setGrade] = useState<RecitationGrade | null>(null);
  const [rawSpoken, setRawSpoken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [allAttempts, setAllAttempts] = useState<RecitationAttempt[]>(loadAttempts);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const surahInfo = SURAHS[currentSurah - 1];

  const loadSurah = useCallback(async (surahId: number) => {
    setLoading(true);
    try {
      const allWords = await fetchSurahWords(surahId);
      setWords(allWords);
      const grouped = new Map<number, Word[]>();
      for (const w of allWords) {
        if (!w.verse_number) continue;
        const list = grouped.get(w.verse_number) || [];
        list.push(w);
        grouped.set(w.verse_number, list);
      }
      const v: Verse[] = [...grouped.entries()].map(([vn, ws]) => ({
        id: vn,
        verse_number: vn,
        verse_key: `${surahId}:${vn}`,
        hizb_number: 0,
        juz_number: 0,
        page_number: 0,
        translations: [],
        words: ws,
      }));
      setVerses(v);
    } catch {
      const fallback = getFallbackVerses(surahId, 10);
      setVerses(fallback);
      setWords(fallback.flatMap((f) => f.words));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentVerseIdx(0);
    setHiddenWords({});
    setHideAll(false);
    setStartVerse(1);
    setEndVerse(Math.min(10, SURAHS[currentSurah - 1]?.verses || 10));
    setHidePage(true);
    setGrade(null);
    setRawSpoken('');
    setErrorMsg('');
    setStatus('idle');
    loadSurah(currentSurah);
  }, [currentSurah, loadSurah]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleHideWord = (wordKey: string) => {
    setHiddenWords((prev) => ({ ...prev, [wordKey]: !prev[wordKey] }));
  };

  const currentVerse = verses[currentVerseIdx];

  // ── Recite range helpers ──
  const safeStart = Math.min(startVerse, endVerse);
  const safeEnd = Math.max(startVerse, endVerse);
  const rangeWords = useMemo(
    () => words.filter((w) => w.verse_number && w.verse_number >= safeStart && w.verse_number <= safeEnd),
    [words, safeStart, safeEnd]
  );
  const targetText = useMemo(
    () => rangeWords.map((w) => w.text_uthmani || w.text).join(' '),
    [rangeWords]
  );
  const rangeVerseNumbers = useMemo(
    () => Array.from(new Set(rangeWords.map((w) => w.verse_number!).sort((a, b) => a - b))),
    [rangeWords]
  );

  const feedbackByVerse = useMemo(() => {
    if (!grade) return null;
    const result: { verse: number; words: { text: string; correct: boolean }[] }[] = [];
    let wi = 0;
    for (const vn of rangeVerseNumbers) {
      const count = rangeWords.filter((w) => w.verse_number === vn).length;
      result.push({ verse: vn, words: grade.targetFeedback.slice(wi, wi + count) });
      wi += count;
    }
    return result;
  }, [grade, rangeVerseNumbers, rangeWords]);

  const surahAttempts = useMemo(() => allAttempts.filter((a) => a.surahId === currentSurah), [allAttempts, currentSurah]);

  const saveAttempt = useCallback((g: RecitationGrade, spoken: string) => {
    const attempt: RecitationAttempt = {
      id: makeId(),
      surahId: currentSurah,
      verseStart: safeStart,
      verseEnd: safeEnd,
      accuracy: g.accuracy,
      targetWords: g.targetFeedback.length,
      missingWords: g.targetFeedback.filter((w) => !w.correct).length,
      extraWords: g.extraWords,
      rawTranscript: spoken,
      timestamp: Date.now(),
    };
    setAllAttempts((prev) => {
      const next = [attempt, ...prev].slice(0, 200);
      try {
        localStorage.setItem(getStorageKey('recitationAttempts'), JSON.stringify(next));
      } catch {}
      return next;
    });
    if (isAuthenticated && userId) {
      syncRecitation(userId, attempt).catch(() => {});
    }
  }, [currentSurah, safeStart, safeEnd, isAuthenticated, userId]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (status === 'recording') {
      stopRecording();
      return;
    }
    setGrade(null);
    setRawSpoken('');
    setErrorMsg('');
    if (!recorderSupported) {
      setErrorMsg(isAr ? 'التسجيل غير مدعوم في هذا المتصفح.' : 'Recording is not supported in this browser.');
      setStatus('error');
      return;
    }
    if (!targetText.trim()) {
      setErrorMsg(isAr ? 'لا توجد آيات في هذا النطاق.' : 'No verses in this range.');
      setStatus('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setStatus('processing');
        try {
          const spoken = await transcribeRecitation(blob, 'ar');
          setRawSpoken(spoken);
          const g = gradeRecitation(targetText, spoken);
          setGrade(g);
          saveAttempt(g, spoken);
        } catch (e) {
          setErrorMsg(e instanceof Error ? e.message : 'Transcription failed.');
          setStatus('error');
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      mr.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setErrorMsg(isAr ? 'حدث خطأ أثناء التسجيل.' : 'An error occurred during recording.');
        setStatus('error');
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setStatus('recording');
    } catch {
      setErrorMsg(isAr ? 'تعذر الوصول إلى الميكروفون.' : 'Could not access the microphone.');
      setStatus('error');
    }
  }, [status, stopRecording, isAr, targetText, saveAttempt]);

  const accuracyPct = grade ? Math.round(grade.accuracy * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {isAr ? 'وضع الحفظ' : 'Memorization Mode'}
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {isAr ? 'رتل من الذاكرة ودع الذكاء الاصطناعي يصحح لك' : 'Recite from memory and let AI correct you'}
        </p>

        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-1 p-1 rounded-xl border w-fit mx-auto mb-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setMode('recite')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: mode === 'recite' ? 'var(--accent-bg)' : 'transparent',
              color: mode === 'recite' ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <Mic size={14} />
            {isAr ? 'رتّل' : 'Recite'}
          </button>
          <button
            onClick={() => setMode('study')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: mode === 'study' ? 'var(--accent-bg)' : 'transparent',
              color: mode === 'study' ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <Eye size={14} />
            {isAr ? 'دراسة' : 'Study'}
          </button>
        </div>

        {/* Surah selector */}
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => currentSurah > 1 && setCurrentSurah(currentSurah - 1)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={18} />
          </button>
          <select
            value={currentSurah}
            onChange={(e) => setCurrentSurah(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
            style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            {SURAHS.map((s) => (
              <option key={s.id} value={s.id}>{s.id}. {isAr ? s.arabic : s.name}</option>
            ))}
          </select>
          <button onClick={() => currentSurah < 114 && setCurrentSurah(currentSurah + 1)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ─────────── RECITE MODE ─────────── */}
      {mode === 'recite' && (
        <div className="space-y-4">
          {/* Range + hide controls */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'من' : 'From'}</span>
              <input
                type="number" min={1} max={verses.length}
                value={safeStart}
                onChange={(e) => setStartVerse(Math.max(1, Math.min(verses.length, Number(e.target.value) || 1)))}
                className="w-16 px-2 py-1 rounded-lg border text-center text-sm outline-none"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'إلى' : 'To'}</span>
              <input
                type="number" min={1} max={verses.length}
                value={safeEnd}
                onChange={(e) => setEndVerse(Math.max(1, Math.min(verses.length, Number(e.target.value) || 1)))}
                className="w-16 px-2 py-1 rounded-lg border text-center text-sm outline-none"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setHidePage(!hidePage)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                background: hidePage ? 'var(--accent-bg)' : 'transparent',
                border: `1px solid ${hidePage ? 'var(--accent)' : 'var(--border)'}`,
                color: hidePage ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {hidePage ? <EyeOff size={14} /> : <Eye size={14} />}
              {hidePage ? (isAr ? 'إظهار' : 'Reveal') : (isAr ? 'إخفاء' : 'Hide Page')}
            </button>
          </div>

          {/* Hidden / visible verses */}
          <div className="rounded-3xl border p-6 md:p-8" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
            {rangeVerseNumbers.length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
                {isAr ? 'لا توجد آيات في هذا النطاق' : 'No verses in this range'}
              </p>
            ) : (
              <div className="space-y-5">
                {rangeVerseNumbers.map((vn) => {
                  const verseWords = rangeWords.filter((w) => w.verse_number === vn);
                  return (
                    <div key={vn} className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold"
                        style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        {vn}
                      </span>
                      <p dir="rtl" className="flex-1 text-2xl md:text-3xl leading-[2] font-arabic text-center"
                        style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif", color: 'var(--text-primary)' }}>
                        {hidePage && !grade
                          ? (isAr ? '＿'.repeat(Math.max(3, verseWords.length)) : '___ '.repeat(Math.max(3, verseWords.length)))
                          : verseWords.map((w) => w.text_uthmani || w.text).join(' ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recite & Test */}
          <div className="rounded-3xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic size={18} style={{ color: 'var(--accent)' }} />
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isAr ? 'رتّل واختبر' : 'Recite & Test'}
                </h2>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isAr ? `${rangeVerseNumbers.length} آية` : `${rangeVerseNumbers.length} verses`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                disabled={status === 'processing'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-60 cursor-pointer"
                style={{ background: status === 'recording' ? 'var(--error)' : 'var(--accent)', color: 'var(--on-accent)' }}
              >
                {status === 'recording' ? <Square size={16} fill="currentColor" /> : status === 'processing' ? <Loader size={16} className="animate-spin" /> : <Mic size={16} />}
                {status === 'recording'
                  ? (isAr ? 'إيقاف' : 'Stop')
                  : status === 'processing'
                    ? (isAr ? 'جارٍ التحليل...' : 'Analyzing...')
                    : (isAr ? 'ابدأ التلاوة' : 'Start Recitation')}
              </motion.button>
              {status === 'recording' && (
                <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--error)' }}>
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--error)' }} />
                  {isAr ? 'تسجيل...' : 'Recording...'}
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: 'var(--error-bg, #fef2f2)', color: 'var(--error)', border: '1px solid var(--error)' }}>
                <X size={16} className="flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Result */}
            <AnimatePresence>
              {grade && feedbackByVerse && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-2xl border"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracyPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: accuracyPct >= 80 ? 'var(--success)' : accuracyPct >= 50 ? 'var(--warning, #d97706)' : 'var(--error)' }}
                      />
                    </div>
                    <span className="text-lg font-bold tabular-nums" style={{ color: accuracyPct >= 80 ? 'var(--success)' : accuracyPct >= 50 ? 'var(--warning, #d97706)' : 'var(--error)' }}>
                      {accuracyPct}%
                    </span>
                  </div>

                  <div className="space-y-4">
                    {feedbackByVerse.map(({ verse, words: wds }) => (
                      <div key={verse} className="flex items-start gap-3">
                        <span className="flex-shrink-0 mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold"
                          style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                          {verse}
                        </span>
                        <p dir="rtl" className="flex-1 flex flex-wrap gap-x-1.5 gap-y-0.5 text-xl leading-relaxed font-arabic"
                          style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                          {wds.map((w, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5" style={{ color: w.correct ? 'var(--text-primary)' : 'var(--error)', fontWeight: w.correct ? 400 : 700 }}>
                              {w.word}
                              {w.correct ? <Check size={12} style={{ color: 'var(--success)' }} /> : <X size={12} style={{ color: 'var(--error)' }} />}
                            </span>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>

                  {grade.extraWords.length > 0 && (
                    <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                      {isAr ? 'كلمات إضافية:' : 'Extra words:'}{' '}
                      <span dir="rtl" style={{ color: 'var(--warning, #d97706)' }}>{grade.extraWords.join(' ')}</span>
                    </p>
                  )}

                  {rawSpoken.trim() && (
                    <div className="mt-3 p-2.5 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                        {isAr ? 'ما التقطه النظام' : 'Transcribed'}
                      </p>
                      <p dir="rtl" className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                        {rawSpoken}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Attempt history */}
          {surahAttempts.length > 0 && (
            <div className="rounded-3xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-3">
                <History size={16} style={{ color: 'var(--accent)' }} />
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isAr ? 'آخر المحاولات' : 'Recent Attempts'}
                </h2>
                <div className="flex-1" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isAr ? 'أفضل نتيجة: ' : 'Best: '}
                  <b style={{ color: 'var(--success)' }}>{Math.round(Math.max(...surahAttempts.map((a) => a.accuracy)) * 100)}%</b>
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {surahAttempts.slice(0, 12).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                    <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {new Date(a.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {a.verseStart}–{a.verseEnd}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round(a.accuracy * 100)}%`, background: a.accuracy >= 0.8 ? 'var(--success)' : a.accuracy >= 0.5 ? 'var(--warning, #d97706)' : 'var(--error)' }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {Math.round(a.accuracy * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────── STUDY MODE ─────────── */}
      {mode === 'study' && (
        <>
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setHideAll(!hideAll)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: hideAll ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                border: `1px solid ${hideAll ? 'var(--accent)' : 'var(--border)'}`,
                color: hideAll ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {hideAll ? <EyeOff size={14} /> : <Eye size={14} />}
              {hideAll ? (isAr ? 'إظهار الكل' : 'Reveal All') : (isAr ? 'إخفاء الكل' : 'Hide All')}
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {currentVerseIdx + 1}/{verses.length}
            </span>
          </div>

          {currentVerse && (
            <motion.div
              key={currentVerseIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border p-8 mb-6"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex flex-wrap justify-end gap-2" dir="rtl">
                {currentVerse.words.filter((w) => w.char_type_name === 'word' || w.char_type_name === 'end').map((word) => {
                  const wordKey = `${currentVerse.verse_key}-${word.id}`;
                  const isHidden = hideAll || hiddenWords[wordKey];
                  if (word.char_type_name === 'end') {
                    return (
                      <span key={wordKey} className="text-2xl font-arabic" style={{ color: 'var(--text-muted)' }}>
                        {word.text_uthmani || '۝'}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={wordKey}
                      onClick={() => toggleHideWord(wordKey)}
                      className="px-2 py-1 rounded-lg transition-all cursor-pointer"
                      style={{ background: isHidden ? 'var(--accent-bg)' : 'transparent' }}
                    >
                      {isHidden ? (
                        <span className="text-2xl font-arabic" style={{ color: 'var(--accent)', opacity: 0.5 }}>___</span>
                      ) : (
                        <span className="text-2xl font-arabic" style={{ color: 'var(--text-primary)' }}>
                          {word.text_uthmani || word.text}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="text-center mt-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                  {currentVerse.verse_number}
                </span>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentVerseIdx((i) => Math.max(0, i - 1))}
              disabled={currentVerseIdx <= 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-30 cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
              {isAr ? 'السابق' : 'Previous'}
            </button>
            <button
              onClick={() => setCurrentVerseIdx((i) => Math.min(verses.length - 1, i + 1))}
              disabled={currentVerseIdx >= verses.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all on-accent disabled:opacity-30 cursor-pointer"
              style={{ background: 'var(--accent)' }}
            >
              {isAr ? 'التالي' : 'Next'}
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* Footer hint */}
      <div className="mt-8 text-center">
        <GraduationCap size={18} className="mx-auto mb-1.5" style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          {isAr
            ? 'اضغط على الكلمات في وضع الدراسة لإخفائها، أو في وضع التلاوة اخفِ الصفحة وابدأ التسجيل ليراجعك الذكاء الاصطناعي.'
            : 'Tap words in Study mode to hide them, or in Recite mode hide the page and record to get AI feedback.'}
        </p>
      </div>
    </div>
  );
}
