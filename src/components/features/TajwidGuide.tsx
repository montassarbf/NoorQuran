import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Shuffle, Mic, Square, Loader, Check, X, Info, Dices } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SURAHS } from '../../data/surahs';
import { getTajweedVerse, buildTajweedSpans, getVerseRuleCounts, getSurahVerseCountTajweed, type TajweedVerseEntry } from '../../data/tajweed';
import { TAJWEED_RULE_LIST, TAJWEED_RULE_INFO } from '../../data/tajweed/rules';
import { transcribeRecitation, gradeRecitation, type RecitationGrade } from '../../services/recitationApi';

type RecordStatus = 'idle' | 'recording' | 'processing' | 'error';

const recorderSupported = typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export default function TajwidGuide() {
  const { language, settings } = useApp();
  const isAr = language === 'ar';
  const [surah, setSurah] = useState(settings.lastSurah || 1);
  const [ayah, setAyah] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [focusedRule, setFocusedRule] = useState<string | null>(null);

  const [status, setStatus] = useState<RecordStatus>('idle');
  const [result, setResult] = useState<RecitationGrade | null>(null);
  const [rawSpoken, setRawSpoken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [streamRef, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const entry: TajweedVerseEntry | undefined = useMemo(() => getTajweedVerse(surah, ayah), [surah, ayah]);
  const spans = useMemo(() => (entry ? buildTajweedSpans(entry) : []), [entry]);
  const ruleCounts = useMemo(() => (entry ? getVerseRuleCounts(entry) : {}), [entry]);
  const surahAyahCount = useMemo(() => getSurahVerseCountTajweed(surah), [surah]);

  const goAyah = useCallback((delta: number) => {
    setAyah((prev) => {
      let next = prev + delta;
      if (next < 1) next = surahAyahCount;
      if (next > surahAyahCount) next = 1;
      return next;
    });
  }, [surahAyahCount]);

  const randomAyah = useCallback(() => {
    setAyah(Math.floor(Math.random() * surahAyahCount) + 1);
  }, [surahAyahCount]);

  useEffect(() => {
    setResult(null);
    setRawSpoken('');
  }, [surah, ayah]);

  useEffect(() => {
    return () => {
      streamRef?.getTracks().forEach((t) => t.stop());
    };
  }, [streamRef]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (status === 'recording') {
      stopRecording();
      return;
    }
    setResult(null);
    setRawSpoken('');
    setErrorMsg('');
    if (!recorderSupported) {
      setErrorMsg(isAr ? 'التسجيل غير مدعوم في هذا المتصفح.' : 'Recording is not supported in this browser.');
      setStatus('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(stream);
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const mime = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        setStatus('processing');
        try {
          const spoken = await transcribeRecitation(blob, 'ar');
          setRawSpoken(spoken);
          setResult(gradeRecitation(entry?.text || '', spoken));
        } catch (e) {
          setErrorMsg(e instanceof Error ? e.message : 'Transcription failed.');
          setStatus('error');
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          setStream(null);
        }
      };
      mr.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
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
  }, [entry, isAr, status, stopRecording]);

  const accuracyPct = result ? Math.round(result.accuracy * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {isAr ? 'تعلم التجويد' : 'Tajweed Guide'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isAr ? 'تعلّم أحكام التلاوة بألوان واضحة وتدرب بصوتك' : 'Learn the rules of recitation with clear colors and practice with your voice'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-[160px]">
          <select
            value={surah}
            onChange={(e) => { setSurah(Number(e.target.value)); setAyah(1); }}
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {SURAHS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}. {isAr ? s.arabic : s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => goAyah(-1)} className="p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <ChevronRight size={16} />
          </button>
          <span className="px-3 py-2 rounded-xl border text-sm font-semibold tabular-nums" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            {ayah} / {surahAyahCount}
          </span>
          <button onClick={() => goAyah(1)} className="p-2 rounded-xl border transition-all hover:scale-105 cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <ChevronLeft size={16} />
          </button>
        </div>
        <button onClick={randomAyah} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all hover:scale-105 cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Dices size={14} />
          {isAr ? 'آية عشوائية' : 'Random'}
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer"
          style={{ background: showLegend ? 'var(--accent-bg)' : 'transparent', borderColor: showLegend ? 'var(--accent)' : 'var(--border)', color: showLegend ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <Info size={14} />
          {isAr ? 'الأحكام' : 'Rules'}
        </button>
      </div>

      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 rounded-2xl border space-y-1.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
              {TAJWEED_RULE_LIST.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setFocusedRule(focusedRule === r.id ? null : r.id)}
                  className="w-full flex items-start gap-2.5 p-1.5 rounded-xl transition-colors text-left cursor-pointer hover:opacity-80"
                  style={{
                    opacity: focusedRule === null || focusedRule === r.id ? 1 : 0.35,
                    background: focusedRule === r.id ? 'var(--accent-bg)' : 'transparent',
                  }}
                >
                  <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full mt-0.5" style={{ background: r.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{isAr ? r.labelAr : r.labelEn}</span>
                    <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {isAr ? r.descriptionAr : r.descriptionEn}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verse display */}
      <div
        className="rounded-3xl border p-6 md:p-10 mb-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {isAr ? `${SURAHS[surah - 1]?.arabic} : ${ayah}` : `Surah ${surah}, Verse ${ayah}`}
          </span>
          {entry && (
            <div className="flex flex-wrap justify-end gap-1.5 max-w-[60%]">
              {Object.entries(ruleCounts).map(([rule, count]) => {
                const info = TAJWEED_RULE_INFO[rule];
                if (!info) return null;
                const dimmed = focusedRule !== null && focusedRule !== rule;
                return (
                  <span
                    key={rule}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: `${info.color}22`, color: info.color, opacity: dimmed ? 0.3 : 1 }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />
                    {count}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <p
          dir="rtl"
          className="text-3xl md:text-4xl leading-[2.2] text-center font-arabic select-text"
          style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif", color: 'var(--text-primary)' }}
        >
          {spans.map((span, i) => {
            if (span.rule === null) {
              return (
                <span key={i} style={{ opacity: focusedRule === null ? 1 : 0.25 }}>
                  {span.text}
                </span>
              );
            }
            const info = TAJWEED_RULE_INFO[span.rule];
            if (!info) return <span key={i}>{span.text}</span>;
            const dimmed = focusedRule !== null && focusedRule !== span.rule;
            return (
              <span key={i} style={{ color: info.color, opacity: dimmed ? 0.25 : 1, fontWeight: 600 }}>
                {span.text}
              </span>
            );
          })}
        </p>

        {!entry && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
            {isAr ? 'هذه الآية غير متوفرة' : 'This verse is not available'}
          </p>
        )}
      </div>

      {/* Recite & Test */}
      <div className="rounded-3xl border p-5 md:p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Mic size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {isAr ? 'رتل واختبر' : 'Recite & Test'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isAr ? 'سجّل تلاوتك لهذه الآية وسيحللها الذكاء الاصطناعي' : 'Record your recitation of this verse and get AI feedback'}
            </p>
          </div>
        </div>

        {!recorderSupported && (
          <div className="p-3 rounded-xl text-sm mb-3" style={{ background: 'var(--error-bg, #fef2f2)', color: 'var(--error)', border: '1px solid var(--error)' }}>
            {isAr ? 'التسجيل غير مدعوم في هذا المتصفح. جرّب متصفحاً حديثاً.' : 'Recording is not supported in this browser. Try a modern browser.'}
          </div>
        )}

        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            disabled={status === 'processing'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-60 cursor-pointer"
            style={{
              background: status === 'recording' ? 'var(--error)' : 'var(--accent)',
              color: 'var(--on-accent)',
            }}
          >
            {status === 'recording' ? <Square size={16} fill="currentColor" /> : status === 'processing' ? <Loader size={16} className="animate-spin" /> : <Mic size={16} />}
            {status === 'recording'
              ? (isAr ? 'إيقاف' : 'Stop')
              : status === 'processing'
                ? (isAr ? 'جارٍ التحليل...' : 'Analyzing...')
                : (isAr ? 'ابدأ التسجيل' : 'Start Recording')}
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

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3 mb-3">
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

              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                {isAr ? 'كلمات الآية' : 'Verse words'}
              </p>
              <p dir="rtl" className="flex flex-wrap gap-x-1.5 gap-y-1 text-xl leading-relaxed mb-3 font-arabic" style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                {result.targetFeedback.map((w, i) => (
                  <span key={i} className="flex items-center gap-0.5" style={{ color: w.correct ? 'var(--text-primary)' : 'var(--error)' }}>
                    {w.word}
                    {w.correct ? (
                      <Check size={12} style={{ color: 'var(--success)' }} />
                    ) : (
                      <X size={12} style={{ color: 'var(--error)' }} />
                    )}
                  </span>
                ))}
              </p>

              {result.extraWords.length > 0 && (
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  {isAr ? 'كلمات إضافية سمعها النظام:' : 'Extra words the system heard:'}{' '}
                  <span dir="rtl" style={{ color: 'var(--warning, #d97706)' }}>{result.extraWords.join(' ')}</span>
                </p>
              )}

              {rawSpoken.trim() && (
                <div className="mt-2 p-2.5 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    {isAr ? 'ما التقطه النظام' : 'What was transcribed'}
                  </p>
                  <p dir="rtl" className="text-sm font-arabic leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                    {rawSpoken}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="mt-6 text-center">
        <BookOpen size={18} className="mx-auto mb-1.5" style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          {isAr
            ? 'تلميح: انقر على أي قاعدة في لوحة الأحكام لإبرازها في الآية.'
            : 'Tip: click a rule in the rules panel to highlight it across the verse.'}
        </p>
      </div>
    </div>
  );
}
