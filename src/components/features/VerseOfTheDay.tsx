import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const AYAHS = [
  { arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', surah: 94, verse: 6, translation: 'Indeed, with hardship comes ease.' },
  { arabic: 'وَٱتَّقُوا۟ ٱللَّهَ وَيُعَلِّمُكُمُ ٱللَّهُ', surah: 2, verse: 282, translation: 'Fear Allah, and Allah will teach you.' },
  { arabic: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ', surah: 65, verse: 3, translation: 'Whoever relies upon Allah, He is sufficient for them.' },
  { arabic: 'وَرَحْمَتِى وَسِعَتْ كُلَّ شَىْءٍ', surah: 7, verse: 156, translation: 'My mercy encompasses all things.' },
  { arabic: 'إِنَّ ٱللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا۟ مَا بِأَنفُسِهِمْ', surah: 13, verse: 11, translation: 'Allah does not change a people\'s condition until they change what is within themselves.' },
  { arabic: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', surah: 94, verse: 5, translation: 'So truly with hardship comes ease.' },
  { arabic: 'وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ', surah: 3, verse: 139, translation: 'Do not weaken nor grieve, for you will be superior.' },
  { arabic: 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا', surah: 65, verse: 2, translation: 'Whoever fears Allah, He will make a way out.' },
  { arabic: 'وَمَا تَوْفِيقِىٓ إِلَّا بِٱللَّهِ', surah: 11, verse: 88, translation: 'My success is only from Allah.' },
  { arabic: 'رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْأٓخِرَةِ حَسَنَةً وَقِنَا عَذَابَ ٱلنَّارِ', surah: 2, verse: 201, translation: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.' },
];

export default function VerseOfTheDay() {
  const { language } = useApp();
  const [ayah, setAyah] = useState(() => AYAHS[Math.floor(Math.random() * AYAHS.length)]);

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('misbah_votd');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          setAyah(parsed.ayah);
          return;
        }
      } catch {}
    }
    const newAyah = AYAHS[Math.abs(hashCode(today)) % AYAHS.length];
    localStorage.setItem('misbah_votd', JSON.stringify({ date: today, ayah: newAyah }));
    setAyah(newAyah);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4 text-center relative overflow-hidden h-full"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--accent)',
        boxShadow: '0 0 20px var(--accent-bg)',
      }}
    >
      {/* Islamic geometric corner decorations */}
      <svg className="absolute top-0 left-0 w-16 h-16" viewBox="0 0 60 60">
        <path d="M0,0 L30,0 L30,5 L5,5 L5,30 L0,30 Z" fill="var(--accent)" opacity="0.06" />
        <path d="M0,0 L20,0 L20,3 L3,3 L3,20 L0,20 Z" fill="var(--accent)" opacity="0.08" />
        <polygon points="0,0 12,6 0,12" fill="var(--accent)" opacity="0.04" />
      </svg>
      <svg className="absolute top-0 right-0 w-16 h-16" viewBox="0 0 60 60">
        <path d="M60,0 L30,0 L30,5 L55,5 L55,30 L60,30 Z" fill="var(--accent)" opacity="0.06" />
        <path d="M60,0 L40,0 L40,3 L57,3 L57,20 L60,20 Z" fill="var(--accent)" opacity="0.08" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-16 h-16" viewBox="0 0 60 60">
        <path d="M0,60 L30,60 L30,55 L5,55 L5,30 L0,30 Z" fill="var(--accent)" opacity="0.06" />
        <path d="M0,60 L20,60 L20,57 L3,57 L3,40 L0,40 Z" fill="var(--accent)" opacity="0.08" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-16 h-16" viewBox="0 0 60 60">
        <path d="M60,60 L30,60 L30,55 L55,55 L55,30 L60,30 Z" fill="var(--accent)" opacity="0.06" />
        <path d="M60,60 L40,60 L40,57 L57,57 L57,40 L60,40 Z" fill="var(--accent)" opacity="0.08" />
      </svg>
      {/* Decorative top line */}
      <svg className="absolute top-0 left-1/4 right-1/4 h-[3px]" viewBox="0 0 200 3" preserveAspectRatio="none">
        <line x1="0" y1="1.5" x2="200" y2="1.5" stroke="var(--accent)" strokeWidth="0.5" opacity="0.15" />
        <circle cx="100" cy="1.5" r="1.5" fill="var(--accent)" opacity="0.2" />
      </svg>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
        {language === 'ar' ? 'آية اليوم' : 'Verse of the Day'}
      </p>
      <p className="font-arabic text-2xl leading-relaxed mb-2" dir="rtl" style={{ color: 'var(--text-primary)' }}>
        {ayah.arabic}
      </p>
      <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
        {ayah.translation}
      </p>
      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
        {language === 'ar' ? 'سورة' : 'Surah'} {ayah.surah}:{ayah.verse}
      </p>
    </motion.div>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
  }
  return hash;
}
