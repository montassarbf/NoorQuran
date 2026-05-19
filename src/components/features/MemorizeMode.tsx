import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SURAHS } from '../../data/surahs';
import { fetchVersesByChapter, getFallbackVerses } from '../../services/quranApi';
import type { Verse } from '../../types';

export default function MemorizeMode() {
  const { memorization, updateMemorization, language } = useApp();
  const [currentSurah, setCurrentSurah] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVerseIdx, setCurrentVerseIdx] = useState(0);
  const [hiddenWords, setHiddenWords] = useState<Record<string, boolean>>({});
  const [hideAll, setHideAll] = useState(false);

  const surahInfo = SURAHS[currentSurah - 1];

  const loadVerses = useCallback(async (surahId: number) => {
    setLoading(true);
    try {
      const data = await fetchVersesByChapter(surahId, 1, 50);
      setVerses(data.verses);
    } catch {
      const fallback = getFallbackVerses(surahId, 10);
      setVerses(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentVerseIdx(0);
    setHiddenWords({});
    setHideAll(false);
    loadVerses(currentSurah);
  }, [currentSurah, loadVerses]);

  const toggleHideWord = (wordKey: string) => {
    setHiddenWords((prev) => ({ ...prev, [wordKey]: !prev[wordKey] }));
  };

  const toggleHideAll = () => {
    setHideAll(!hideAll);
  };

  const currentVerse = verses[currentVerseIdx];

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
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {language === 'ar' ? 'وضع الحفظ' : 'Memorization Mode'}
        </h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => currentSurah > 1 && setCurrentSurah(currentSurah - 1)}
            className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            <BookOpen size={12} />
            {surahInfo?.name} ({currentSurah})
          </span>
          <button
            onClick={() => currentSurah < 114 && setCurrentSurah(currentSurah + 1)}
            className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={toggleHideAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: hideAll ? 'var(--accent-bg)' : 'var(--bg-secondary)',
              border: `1px solid ${hideAll ? 'var(--accent)' : 'var(--border)'}`,
              color: hideAll ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            {hideAll ? <EyeOff size={14} /> : <Eye size={14} />}
            {hideAll
              ? (language === 'ar' ? 'إظهار الكل' : 'Reveal All')
              : (language === 'ar' ? 'إخفاء الكل' : 'Hide All')}
          </button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {currentVerseIdx + 1}/{verses.length}
          </span>
        </div>
      </div>

      {/* Verse Display */}
      {currentVerse && (
        <motion.div
          key={currentVerseIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border p-8 mb-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-wrap justify-end gap-2" dir="rtl">
            {currentVerse.words.filter(w => w.char_type_name === 'word' || w.char_type_name === 'end').map((word, idx) => {
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
                  style={{
                    background: isHidden ? 'var(--accent-bg)' : 'transparent',
                  }}
                >
                  {isHidden ? (
                    <span className="text-2xl font-arabic" style={{ color: 'var(--accent)', opacity: 0.5 }}>
                      {'___'}
                    </span>
                  ) : (
                    <span className="text-2xl font-arabic" style={{ color: 'var(--text-primary)' }}>
                      {word.text_uthmani || word.text}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Verse number */}
          <div className="text-center mt-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              {currentVerse.verse_number}
            </span>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentVerseIdx((i) => Math.max(0, i - 1))}
          disabled={currentVerseIdx <= 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-30"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={16} />
          {language === 'ar' ? 'السابق' : 'Previous'}
        </button>
        <button
          onClick={() => setCurrentVerseIdx((i) => Math.min(verses.length - 1, i + 1))}
          disabled={currentVerseIdx >= verses.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all text-white disabled:opacity-30"
          style={{ background: 'var(--accent)' }}
        >
          {language === 'ar' ? 'التالي' : 'Next'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
