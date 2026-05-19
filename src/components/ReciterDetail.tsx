import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Music, Play, Headphones } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getReciterById, RECITERS, getReciterImageUrl } from '../data/reciters-data';
import { SURAHS } from '../data/surahs';

export default function ReciterDetail() {
  const { reciterId } = useParams<{ reciterId: string }>();
  const navigate = useNavigate();
  const { language, updateSettings, t } = useApp();

  const reciter = useMemo(() => getReciterById(reciterId || ''), [reciterId]);

  useEffect(() => {
    if (!reciter && reciterId) {
      navigate('/reciters', { replace: true });
    }
  }, [reciter, reciterId, navigate]);

  if (!reciter) return null;

  const handlePlaySurah = (surahId: number) => {
    updateSettings({ reciter: reciter.id, lastSurah: surahId });
    navigate(`/quran/${surahId}`);
  };

  const handlePlayRadio = () => {
    updateSettings({ reciter: reciter.id, lastSurah: 1 });
    navigate('/quran/1');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/reciters')}
        className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-all hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} />
        {language === 'ar' ? 'العودة إلى القراء' : 'Back to Reciters'}
      </button>

      {/* Reciter Profile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border overflow-hidden mb-8"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Photo */}
            <img
              src={getReciterImageUrl(reciter, 200)}
              alt={reciter.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 flex-shrink-0"
              style={{ borderColor: reciter.color }}
            />
            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {reciter.name}
              </h1>
              <p className="text-sm font-arabic mb-3" style={{ color: 'var(--text-muted)' }}>
                {reciter.arabicName}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <Globe size={12} />
                  {reciter.country}
                </span>
                <span className="flex items-center gap-1">
                  <Music size={12} />
                  {reciter.style}
                </span>
              </div>
              {/* Play Radio */}
              <button
                onClick={handlePlayRadio}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: reciter.color }}
              >
                <Headphones size={16} />
                {language === 'ar' ? 'تشغيل الراديو' : 'Play Radio'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Surah List */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Play size={16} style={{ color: 'var(--accent)' }} />
          {language === 'ar' ? 'السور بصوت' : 'Surahs by'} {reciter.name}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {SURAHS.map((surah, idx) => (
          <motion.button
            key={surah.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.008 }}
            onClick={() => handlePlaySurah(surah.id)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              {surah.id}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{surah.name}</div>
              <div className="text-[10px] font-arabic truncate" style={{ color: 'var(--text-muted)' }}>{surah.arabic}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
