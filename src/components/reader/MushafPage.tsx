import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Bookmark, BookmarkCheck, X, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMushaf } from '../../context/MushafContext';
import { fetchSvgPage } from '../../services/mushafApi';
import { SURAHS } from '../../data/surahs';
import { getRiwayah } from '../../data/mushaf/riwayat';

interface SelectedAyah {
  surah: number;
  ayah: number;
}

function sanitizeSvg(raw: string): string {
  return raw.replace(/^\s*<\?xml[^>]*\?>\s*/i, '');
}

export default function MushafPage() {
  const { riwayah, currentPage, nextPage, prevPage } = useMushaf();
  const { bookmarks, addBookmark, removeBookmark, playVerseAudio, t, language } = useApp();
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah | null>(null);

  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeLock = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setSelectedAyah(null);
    fetchSvgPage(riwayah, currentPage)
      .then((raw) => {
        if (cancelled) return;
        setSvg(sanitizeSvg(raw));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [riwayah, currentPage]);

  useEffect(() => {
    if (currentPage < 604) fetchSvgPage(riwayah, currentPage + 1).catch(() => {});
    if (currentPage > 1) fetchSvgPage(riwayah, currentPage - 1).catch(() => {});
  }, [riwayah, currentPage]);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (swipeLock.current) return;
      const target = (e.target as Element).closest?.('path.ayahPolygon') as SVGPathElement | null;
      if (!target) return;
      const surah = parseInt(target.getAttribute('surah') || '0', 10);
      const ayah = parseInt(target.getAttribute('ayah') || '0', 10);
      if (surah && ayah) setSelectedAyah({ surah, ayah });
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
    swipeLock.current = false;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeStart.current || swipeLock.current) return;
    const dx = e.clientX - swipeStart.current.x;
    const dy = e.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    swipeLock.current = true;
    if (dx < 0) nextPage();
    else prevPage();
  };

  const isBookmarked =
    selectedAyah != null &&
    bookmarks.some((b) => b.surahId === selectedAyah.surah && b.verseNumber === selectedAyah.ayah);

  const toggleSelectedBookmark = () => {
    if (!selectedAyah) return;
    const { surah, ayah } = selectedAyah;
    if (bookmarks.some((b) => b.surahId === surah && b.verseNumber === ayah)) {
      removeBookmark(surah, ayah);
    } else {
      addBookmark({ surahId: surah, verseNumber: ayah, note: '', timestamp: Date.now() });
    }
  };

  const playSelectedVerse = () => {
    if (!selectedAyah) return;
    const surahInfo = SURAHS[selectedAyah.surah - 1];
    playVerseAudio(selectedAyah.surah, selectedAyah.ayah, 'verse', surahInfo?.verses || 0, []);
    setSelectedAyah(null);
  };

  const surahInfo = selectedAyah ? SURAHS[selectedAyah.surah - 1] : null;
  const riwayahInfo = getRiwayah(riwayah);

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Page header */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl border transition-all hover:opacity-70 disabled:opacity-30"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
          {currentPage} / 604
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage >= 604}
          className="p-2 rounded-xl border transition-all hover:opacity-70 disabled:opacity-30"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Riwayah badge */}
      <p className="text-center text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
        {riwayahInfo.arabicName} · {riwayahInfo.name}
      </p>

      {/* Page / SVG */}
      <div
        className="mushaf-svg rounded-2xl border overflow-hidden select-none touch-pan-y"
        style={{ background: '#fdfcf7', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
        onClick={handleSvgClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader size={22} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center px-6">
            <p className="text-sm" style={{ color: 'var(--error)' }}>Failed to load page.</p>
            <button
              onClick={() => fetchSvgPage(riwayah, currentPage).then((raw) => { setSvg(sanitizeSvg(raw)); setError(false); }).catch(() => {})}
              className="px-4 py-2 rounded-xl text-xs font-medium on-accent"
              style={{ background: 'var(--accent)' }}
            >
              {t('tryAgain')}
            </button>
          </div>
        )}
        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${riwayah}-${currentPage}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </AnimatePresence>
        )}
      </div>

      {/* Page footer info */}
      <p className="text-center mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {t('page')} {currentPage} · {riwayahInfo.totalAyahs} {language === 'ar' ? 'آية' : 'ayahs'}
      </p>

      {/* Ayah action popover */}
      <AnimatePresence>
        {selectedAyah && surahInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70]"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              onClick={() => setSelectedAyah(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[71] rounded-t-2xl border-t shadow-2xl px-5 pt-4 pb-6 sm:max-w-md sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:bottom-6"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {selectedAyah.surah}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {surahInfo.name} · {language === 'ar' ? 'آية' : 'Verse'} {selectedAyah.ayah}
                    </p>
                    <p className="font-arabic text-lg leading-tight" style={{ color: 'var(--accent)' }}>{surahInfo.arabic}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAyah(null)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={playSelectedVerse}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold on-accent transition-all hover:opacity-85"
                  style={{ background: 'var(--accent)' }}
                >
                  <Play size={15} />
                  {language === 'ar' ? 'تشغيل الآية' : 'Play Verse'}
                </button>
                <button
                  onClick={toggleSelectedBookmark}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    borderColor: isBookmarked ? 'var(--accent)' : 'var(--border)',
                    background: isBookmarked ? 'var(--accent-bg)' : 'transparent',
                    color: isBookmarked ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  {isBookmarked
                    ? (language === 'ar' ? 'محفوظة' : 'Saved')
                    : (language === 'ar' ? 'حفظ الآية' : 'Save')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
