import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Target, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { TasbihCounter } from '../../types';

const DEFAULT_DHIKR: TasbihCounter[] = [
  { id: 'subhanallah', label: 'Subhanallah', arabic: 'سُبْحَانَ ٱللَّهِ', count: 0, goal: 33, transliteration: 'Glory be to Allah' },
  { id: 'alhamdulillah', label: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّهِ', count: 0, goal: 33, transliteration: 'Praise be to Allah' },
  { id: 'allahuakbar', label: 'Allahu Akbar', arabic: 'ٱللَّهُ أَكْبَرُ', count: 0, goal: 34, transliteration: 'Allah is the Greatest' },
  { id: 'la-ilaha', label: 'La ilaha illallah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّهُ', count: 0, goal: 100, transliteration: 'There is no god but Allah' },
  { id: 'astaghfirullah', label: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّهَ', count: 0, goal: 100, transliteration: 'I seek forgiveness from Allah' },
];

export default function Tasbih() {
  const { tasbihCounters, updateTasbihCounter, resetTasbihCounter, language } = useApp();
  const [counters, setCounters] = useState<TasbihCounter[]>(() => {
    if (tasbihCounters.length > 0) return tasbihCounters;
    return DEFAULT_DHIKR;
  });
  const [activeDhikr, setActiveDhikr] = useState<TasbihCounter>(counters[0]);
  const [showSelector, setShowSelector] = useState(false);
  const [ripple, setRipple] = useState(false);

  useEffect(() => {
    const found = counters.find((c) => c.id === activeDhikr.id);
    if (found) setActiveDhikr(found);
  }, [counters, activeDhikr.id]);

  const handleTap = () => {
    const newCount = Math.min(activeDhikr.count + 1, activeDhikr.goal + 33);
    setRipple(true);
    setTimeout(() => setRipple(false), 300);
    updateTasbihCounter(activeDhikr.id, newCount);
    setCounters((prev) =>
      prev.map((c) => (c.id === activeDhikr.id ? { ...c, count: newCount } : c))
    );
  };

  const handleReset = () => {
    resetTasbihCounter(activeDhikr.id);
    setCounters((prev) =>
      prev.map((c) => (c.id === activeDhikr.id ? { ...c, count: 0 } : c))
    );
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDhikr]);

  const progress = activeDhikr.goal > 0 ? Math.min(activeDhikr.count / activeDhikr.goal, 1) : 0;
  const isComplete = activeDhikr.count >= activeDhikr.goal;

  return (
    <div className="max-w-md mx-auto px-4 pt-14 pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {language === 'ar' ? 'التسبيح' : 'Tasbih'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {language === 'ar' ? 'اضغط أو استخدم Space/Enter' : 'Tap or press Space/Enter'}
        </p>
      </div>

      {/* Current Dhikr Display — separate card for the text */}
      <motion.div
        key={activeDhikr.id + '-text'}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border mb-5 p-6 text-center"
        style={{ background: 'var(--accent-bg)', borderColor: 'var(--border)' }}
      >
        <p className="font-arabic text-3xl leading-relaxed mb-2" style={{ color: 'var(--accent)', textAlign: 'center' }}>
          {activeDhikr.arabic}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {activeDhikr.label}
        </p>
        {activeDhikr.transliteration && (
          <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>
            {activeDhikr.transliteration}
          </p>
        )}
      </motion.div>

      {/* Misbaha Counter Card */}
      <motion.div
        key={activeDhikr.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl border p-10 text-center cursor-pointer select-none overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: isComplete ? '0 0 30px var(--accent-bg)' : 'var(--shadow-lg)',
        }}
        onClick={handleTap}
      >
        {/* Bead Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-72 h-72 opacity-15">
            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--accent)" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="var(--accent)" strokeWidth="0.5" opacity="0.6" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="var(--accent)" strokeWidth="0.5" opacity="0.4" />
            <motion.circle
              cx="100" cy="100" r="90"
              fill="none" stroke="var(--accent)" strokeWidth="2.5"
              strokeDasharray={`${progress * 565}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </svg>
        </div>

        {/* Ripple Effect */}
        <AnimatePresence>
          {ripple && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-3xl"
              style={{ background: 'var(--accent-bg)' }}
            />
          )}
        </AnimatePresence>

        {/* Count Display */}
        <div className="relative z-10">
          <motion.div
            key={activeDhikr.count}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-8xl sm:text-9xl font-bold mb-2 font-mono tabular-nums"
            style={{ color: isComplete ? 'var(--accent)' : 'var(--text-primary)' }}
          >
            {activeDhikr.count}
          </motion.div>

          <div className="flex items-center justify-center gap-2 mt-4">
            {/* Bead dots */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: activeDhikr.count % 5 > i ? 1 : 0.6,
                  opacity: activeDhikr.count % 5 > i ? 1 : 0.3,
                }}
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            ))}
          </div>

          <p className="text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
            {language === 'ar' ? 'الهدف' : 'Goal'}: {activeDhikr.goal}
          </p>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full mt-3 mx-auto max-w-[200px]" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress * 100}%`, background: 'var(--accent)' }} />
          </div>

          {/* Completion Badge */}
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium mt-5"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
            >
              <Sparkles size={14} />
              {language === 'ar' ? 'مكتمل!' : 'Completed!'}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <RotateCcw size={14} />
          {language === 'ar' ? 'إعادة' : 'Reset'}
        </button>
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Target size={14} />
          {language === 'ar' ? 'اختيار' : 'Change'}
        </button>
      </div>

      {/* Dhikr Selector */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            {counters.map((dhikr) => (
              <button
                key={dhikr.id}
                onClick={() => { setActiveDhikr(dhikr); setShowSelector(false); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{
                  background: activeDhikr.id === dhikr.id ? 'var(--accent-bg)' : 'transparent',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{dhikr.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dhikr.count}/{dhikr.goal}</p>
                </div>
                <span className="font-arabic text-lg" style={{ color: 'var(--accent)' }}>{dhikr.arabic}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}