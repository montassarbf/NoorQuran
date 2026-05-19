import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { getWordAudioUrl } from '../../services/quranApi';
import { fontSizeMap } from '../../data/quran-utils';
import type { Word } from '../../types';

interface WordByWordDisplayProps {
  words: Word[];
  verseKey: string;
  highlightWordIndex?: number;
}

export default function WordByWordDisplay({ words, verseKey, highlightWordIndex }: WordByWordDisplayProps) {
  const { settings } = useApp();
  const { fontSize, showTransliteration, showWordTranslation, displayMode } = settings;
  const [playingWord, setPlayingWord] = useState<number | null>(null);

  const filtered = words.filter((w) => w.char_type_name === 'word');

  const playWord = async (word: Word, idx: number) => {
    if (!word.audio_url) return;
    setPlayingWord(idx);
    try {
      const audio = new Audio(getWordAudioUrl(word.audio_url));
      audio.onended = () => setPlayingWord(null);
      audio.onerror = () => setPlayingWord(null);
      await audio.play();
    } catch {
      setPlayingWord(null);
    }
  };

  return (
    <div className="flex flex-row flex-wrap gap-x-4 gap-y-3 justify-start" dir="rtl">
      {filtered.map((word, idx) => {
        const highlighted = highlightWordIndex === idx;
        return (
          <motion.button
            key={`${verseKey}-${word.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={highlighted ? { opacity: 1, y: 0, scale: 1.08 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-0.5 cursor-pointer transition-colors rounded-xl px-2.5 py-1.5"
            style={{
              background: highlighted ? 'rgba(184, 134, 11, 0.2)' : 'transparent',
              border: highlighted ? '1px solid rgba(184, 134, 11, 0.5)' : '1px solid transparent',
              boxShadow: highlighted ? '0 0 20px rgba(184, 134, 11, 0.15)' : 'none',
            }}
            onClick={() => playWord(word, idx)}
          >
            <span className={`${fontSizeMap[fontSize]} font-arabic leading-relaxed transition-colors`}
              style={{
                color: highlighted ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              {word.text_uthmani || word.text}

            </span>
            {showTransliteration && word.transliteration?.text && (
              <span className="text-[10px] leading-tight text-center" style={{ color: 'var(--text-muted)' }}>
                {word.transliteration.text}
              </span>
            )}
            {showWordTranslation && word.translation?.text && (
              <span className="text-[10px] leading-tight text-center" style={{ color: 'var(--text-secondary)' }}>
                {word.translation.text}
              </span>
            )}
            
            {playingWord === idx && (
              <Volume2 size={10} style={{ color: 'var(--accent)' }} />
            )}
            
          </motion.button>
        );
      })}
    </div>
  );
}
