import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, RotateCcw, Trophy, BookOpen, Lightbulb, Search, Loader, Check, X, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateQuestions, QUIZ_TYPES, getQuizTimer, resetUsedKeys } from '../../utils/quizLogic';
import type { QuizQuestion } from '../../types';
import { useApp } from '../../context/AppContext';
import { SURAHS } from '../../data/surahs';
import { fetchSurahVersesForQuiz } from '../../services/quranApi';

export default function QuizMode() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [quizType, setQuizType] = useState<'missing-word' | 'surah-id' | 'classic' | 'surah' | 'sahaby'>('missing-word');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahSearch, setSurahSearch] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verseCache = useRef<Record<number, { surah: number; verse: number; text: string }[]>>({});

  const initGame = useCallback(async () => {
    const timer = getQuizTimer();
    setLoading(true);
    setError(null);
    let pool: { surah: number; verse: number; text: string }[] | undefined;

    if (quizType === 'surah' && selectedSurah) {
      const useCache = verseCache.current[selectedSurah];
      if (useCache) {
        pool = useCache;
      } else {
        try {
          const fetched = await fetchSurahVersesForQuiz(selectedSurah);
          if (fetched.length > 0) {
            pool = fetched;
            verseCache.current[selectedSurah] = fetched;
          }
        } catch {
          // API failed, pool stays undefined → falls back to AYAH_POOL
        }
      }
    }

    try {
      const qs = generateQuestions(10, quizType, selectedSurah || undefined, pool);
      if (qs.length === 0) {
        setError(language === 'ar' ? 'لا توجد آيات متاحة لهذه السورة' : 'No verses available for this surah');
        setLoading(false);
        return;
      }
      setQuestions(qs);
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ أثناء إنشاء الأسئلة' : 'Error generating questions');
      setLoading(false);
      return;
    }
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setStreak(0);
    setTimeLeft(timer);
    setGameOver(false);
    setStarted(true);
    setLoading(false);
  }, [quizType, selectedSurah, language]);

  useEffect(() => {
    if (!started || gameOver || selectedAnswer !== null) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, started, gameOver, selectedAnswer]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const correct = index === questions[currentQuestion]?.answerIndex;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((bs) => Math.max(bs, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimeLeft(getQuizTimer());
    } else {
      setGameOver(true);
    }
  };

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border p-8"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-all hover:opacity-70 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} />
            {language === 'ar' ? 'العودة' : 'Back'}
          </button>
          <div className="text-center mb-8">
            <Trophy size={48} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {language === 'ar' ? 'اختبار القرآن' : 'Quran Quiz'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'اختر نوع الاختبار' : 'Choose quiz type'}
            </p>
          </div>

          {/* Quiz Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <p className="text-xs font-semibold col-span-full" style={{ color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'نوع الاختبار' : 'Quiz Type'}
            </p>
            {QUIZ_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setQuizType(t.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center"
                style={{
                  borderColor: quizType === t.id ? 'var(--accent)' : 'var(--border)',
                  background: quizType === t.id ? 'var(--accent-bg)' : 'transparent',
                }}
              >
                <t.icon size={20} />
                <p className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {language === 'ar' ? t.labelAr : t.labelEn}
                </p>
              </button>
            ))}
          </div>

          {/* Surah Picker — shown only for surah quiz type */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-center" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error)' }}>
              {error}
            </div>
          )}

          {quizType === 'surah' && (
            <div className="mb-8">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                {language === 'ar' ? 'اختر سورة' : 'Select a Surah'}
              </p>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-sm border outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                {SURAHS.filter(s => {
                  if (!surahSearch) return true;
                  const q = surahSearch.toLowerCase();
                  return s.name.toLowerCase().includes(q) || s.arabic.includes(q) || s.translation.toLowerCase().includes(q) || String(s.id).includes(q);
                }).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSurah(s.id); setSurahSearch(''); }}
                    className="flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all text-[11px]"
                    style={{
                      borderColor: selectedSurah === s.id ? 'var(--accent)' : 'var(--border)',
                      background: selectedSurah === s.id ? 'var(--accent-bg)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="font-arabic text-sm">{s.arabic}</span>
                    <span className="mt-0.5">{s.name}</span>
                  </button>
                ))}
              </div>
              {!selectedSurah && (
                <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  {language === 'ar' ? 'يرجى اختيار سورة' : 'Please select a surah'}
                </p>
              )}
            </div>
          )}

          <button
            onClick={initGame}
            className="w-full py-3 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
            style={{ background: (quizType === 'surah' && !selectedSurah) || loading ? 'var(--text-muted)' : 'var(--accent)' }}
            disabled={(quizType === 'surah' && !selectedSurah) || loading}
          >
            {loading ? (
              <><Loader size={16} className="animate-spin" /> {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</>
            ) : (
              language === 'ar' ? 'ابدأ الاختبار' : 'Start Quiz'
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameOver) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto px-4 pt-16 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border p-10"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1 }}>
            <Trophy size={64} className="mx-auto mb-4" style={{ color: percentage >= 80 ? 'var(--accent)' : 'var(--text-muted)' }} />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {percentage === 100 ? (language === 'ar' ? 'نتيجة كاملة!' : 'Perfect Score!') :
             percentage >= 80 ? (language === 'ar' ? 'ممتاز!' : 'Excellent!') :
             language === 'ar' ? 'اختبار جيد' : 'Good Effort!'}
          </h2>
          <div className="text-5xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
            {score}/{questions.length}
          </div>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            {language === 'ar' ? 'أفضل سلسلة' : 'Best Streak'}: {bestStreak}
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{percentage}%</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStarted(false)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {language === 'ar' ? 'تغيير النوع' : 'Change Type'}
            </button>
            <button
              onClick={initGame}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all"
              style={{ background: 'var(--accent)' }}
            >
              <RotateCcw size={16} />
              {language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  if (!question) return null;

  const surahName = SURAHS[question.surah - 1]?.name || `Surah ${question.surah}`;

  return (
    <div className="max-w-lg mx-auto px-4 pt-14 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStarted(false)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-all hover:opacity-70 cursor-pointer flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            <Zap size={12} />
            {score}/{questions.length}
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <Zap size={12} />
              {streak}
            </div>
          )}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            {language === 'ar'
              ? QUIZ_TYPES.find(t => t.id === question.type)?.labelAr
              : QUIZ_TYPES.find(t => t.id === question.type)?.labelEn}
          </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: timeLeft < 5 ? 'var(--error-bg)' : 'var(--bg-secondary)',
            color: timeLeft < 5 ? 'var(--error)' : 'var(--text-secondary)',
          }}>
          <Timer size={12} />
          {timeLeft}s
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full mb-6" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%`, background: 'var(--accent)' }} />
      </div>

      {(question.type === 'missing-word' || question.type === 'surah') && (
        <>
          <div className="text-center mb-4">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {surahName} · {language === 'ar' ? 'آية' : 'Ayah'} {question.verse}
            </span>
          </div>

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border p-8 sm:p-10 mb-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="font-arabic text-3xl sm:text-4xl leading-relaxed text-center" dir="rtl" style={{ color: 'var(--text-primary)' }}>
              {question.fullAyah!.split(/\s+/).map((w, i) => (
                i === question.missingIndex ? (
                  <span key={i} className="inline-block px-4 mx-1 rounded-lg animate-pulse"
                    style={{
                      background: selectedAnswer !== null
                        ? (isCorrect ? 'var(--success-bg)' : 'var(--error-bg)')
                        : 'var(--accent-bg)',
                      color: selectedAnswer !== null
                        ? (isCorrect ? 'var(--success)' : 'var(--error)')
                        : 'var(--accent)',
                      borderBottom: selectedAnswer !== null ? 'none' : '2px dashed var(--accent)',
                    }}>
                    {selectedAnswer !== null ? question.missingWord : '_____'}
                  </span>
                ) : (
                  <span key={i}>{w} </span>
                )
              ))}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map((option, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className="py-4 px-5 rounded-xl border text-center font-arabic text-xl transition-all"
                style={{
                  background: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success-bg)' : 'var(--error-bg)')
                    : 'var(--bg-card)',
                  borderColor: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--border)',
                  color: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--text-primary)',
                  opacity: selectedAnswer !== null && idx !== selectedAnswer ? 0.5 : 1,
                }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </>
      )}

      {question.type === 'surah-id' && (
        <>
          <div className="text-center mb-2">
            <BookOpen size={20} className="mx-auto mb-1" style={{ color: 'var(--accent)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'من أي سورة هذه الآية؟' : 'Which surah does this verse belong to?'}
            </p>
          </div>

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border p-8 sm:p-10 mb-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="font-arabic text-3xl sm:text-4xl leading-relaxed text-center" dir="rtl" style={{ color: 'var(--text-primary)' }}>
              {question.fullAyah}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map((option, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className="py-3 px-4 rounded-xl border text-center text-sm font-medium transition-all"
                style={{
                  background: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success-bg)' : 'var(--error-bg)')
                    : 'var(--bg-card)',
                  borderColor: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--border)',
                  color: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--text-primary)',
                  opacity: selectedAnswer !== null && idx !== selectedAnswer ? 0.5 : 1,
                }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </>
      )}

      {question.type === 'classic' && (
        <>
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border p-8 sm:p-10 mb-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Lightbulb size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p className="text-lg sm:text-xl font-medium leading-relaxed text-center" style={{ color: 'var(--text-primary)' }}>
              {language === 'ar' ? (question as any).questionAr || question.question : question.question}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map((option, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className="py-3 px-4 rounded-xl border text-center text-sm font-medium transition-all"
                style={{
                  background: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success-bg)' : 'var(--error-bg)')
                    : 'var(--bg-card)',
                  borderColor: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--border)',
                  color: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--text-primary)',
                  opacity: selectedAnswer !== null && idx !== selectedAnswer ? 0.5 : 1,
                }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </>
      )}

      {question.type === 'sahaby' && (
        <>
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border p-8 sm:p-10 mb-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Users size={32} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p className="font-arabic text-xl sm:text-2xl font-medium leading-relaxed text-center" dir="rtl" style={{ color: 'var(--text-primary)' }}>
              {question.question}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map((option, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className="py-3 px-4 rounded-xl border text-center text-sm font-medium transition-all"
                style={{
                  background: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success-bg)' : 'var(--error-bg)')
                    : 'var(--bg-card)',
                  borderColor: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--border)',
                  color: selectedAnswer === idx
                    ? (isCorrect ? 'var(--success)' : 'var(--error)')
                    : 'var(--text-primary)',
                  opacity: selectedAnswer !== null && idx !== selectedAnswer ? 0.5 : 1,
                }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedAnswer !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-lg font-bold mb-3" style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
              {isCorrect
                ? <><Check size={16} className="inline" style={{ color: 'var(--success)' }} /> {language === 'ar' ? 'صحيح!' : 'Correct!'}</>
                : <><X size={16} className="inline" style={{ color: 'var(--error)' }} /> {language === 'ar' ? `${question.type === 'missing-word' || question.type === 'surah' ? question.missingWord : ''}` : `${question.type === 'missing-word' || question.type === 'surah' ? question.missingWord : ''}`}</>}
            </p>
            <button
              onClick={nextQuestion}
              className="px-6 py-2.5 rounded-xl text-white font-medium transition-all"
              style={{ background: 'var(--accent)' }}
            >
              {currentQuestion + 1 < questions.length
                ? (language === 'ar' ? 'التالي' : 'Next')
                : (language === 'ar' ? 'النتيجة' : 'Show Result')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
