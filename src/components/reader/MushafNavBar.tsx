import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Layers, FileText, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMushaf } from '../../context/MushafContext';
import { SURAHS } from '../../data/surahs';
import { RIWAYAT } from '../../data/mushaf/riwayat';
import { getSurahsOnPage } from '../../services/mushafApi';

type Panel = null | 'surah' | 'juz' | 'page' | 'riwayah';

const JUZS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function MushafNavBar() {
  const { t, language } = useApp();
  const { riwayah, setRiwayah, currentPage, goToSurah, goToJuz, goToPage } = useMushaf();
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [pageSurahs, setPageSurahs] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    let cancelled = false;
    getSurahsOnPage(riwayah, currentPage)
      .then((metas) => {
        if (!cancelled) setPageSurahs(metas.map((m) => m.number));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [riwayah, currentPage]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (p: Panel) => setOpenPanel((prev) => (prev === p ? null : p));

  const submitPage = () => {
    const n = parseInt(pageInput, 10);
    if (!Number.isNaN(n)) goToPage(n);
    setOpenPanel(null);
  };

  const currentSurah = pageSurahs[0] || 1;

  return (
    <div ref={containerRef} className="relative z-30 mb-4">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none rounded-2xl border p-2"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* Surah selector */}
        <button
          onClick={() => toggle('surah')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap"
          style={{
            borderColor: openPanel === 'surah' ? 'var(--accent)' : 'var(--border)',
            background: openPanel === 'surah' ? 'var(--accent-bg)' : 'transparent',
            color: 'var(--text-secondary)',
          }}
        >
          <BookOpen size={13} style={{ color: 'var(--accent)' }} />
          {language === 'ar' ? 'سورة' : 'Surah'}
          <span className="font-bold" style={{ color: 'var(--accent)' }}>{currentSurah}</span>
        </button>

        {/* Juz selector */}
        <button
          onClick={() => toggle('juz')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap"
          style={{
            borderColor: openPanel === 'juz' ? 'var(--accent)' : 'var(--border)',
            background: openPanel === 'juz' ? 'var(--accent-bg)' : 'transparent',
            color: 'var(--text-secondary)',
          }}
        >
          <Layers size={13} style={{ color: 'var(--accent)' }} />
          {language === 'ar' ? 'جزء' : 'Juz'}
        </button>

        {/* Page selector */}
        <button
          onClick={() => toggle('page')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap"
          style={{
            borderColor: openPanel === 'page' ? 'var(--accent)' : 'var(--border)',
            background: openPanel === 'page' ? 'var(--accent-bg)' : 'transparent',
            color: 'var(--text-secondary)',
          }}
        >
          <FileText size={13} style={{ color: 'var(--accent)' }} />
          {language === 'ar' ? 'صفحة' : 'Page'}
          <span className="font-bold" style={{ color: 'var(--accent)' }}>{currentPage}</span>
        </button>

        {/* Riwayah selector */}
        <select
          value={riwayah}
          onChange={(e) => setRiwayah(e.target.value as any)}
          className="ml-auto px-3 py-1.5 rounded-xl border text-xs font-medium outline-none whitespace-nowrap"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {RIWAYAT.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Dropdown panels */}
      <AnimatePresence>
        {openPanel && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', zIndex: 40 }}
          >
            {openPanel === 'surah' && (
              <div className="max-h-72 overflow-y-auto p-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {SURAHS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { goToSurah(s.id); setOpenPanel(null); }}
                    className="flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl text-left text-xs font-medium border transition-all hover:opacity-75"
                    style={{
                      borderColor: s.id === currentSurah ? 'var(--accent)' : 'var(--border)',
                      background: s.id === currentSurah ? 'var(--accent-bg)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="truncate">{s.id}. {language === 'ar' ? s.arabic : s.name}</span>
                  </button>
                ))}
              </div>
            )}

            {openPanel === 'juz' && (
              <div className="max-h-72 overflow-y-auto p-2 grid grid-cols-5 gap-1.5">
                {JUZS.map((j) => (
                  <button
                    key={j}
                    onClick={() => { goToJuz(j); setOpenPanel(null); }}
                    className="px-2 py-2 rounded-xl text-center text-xs font-semibold border transition-all hover:opacity-75"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {j}
                  </button>
                ))}
              </div>
            )}

            {openPanel === 'page' && (
              <div className="p-4 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitPage()}
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={submitPage}
                  className="px-4 py-2 rounded-xl text-sm font-semibold on-accent"
                  style={{ background: 'var(--accent)' }}
                >
                  {t('go')}
                </button>
                <button onClick={() => setOpenPanel(null)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {openPanel === 'riwayah' && (
              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {RIWAYAT.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRiwayah(r.id); setOpenPanel(null); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm border transition-all"
                    style={{
                      borderColor: riwayah === r.id ? 'var(--accent)' : 'var(--border)',
                      background: riwayah === r.id ? 'var(--accent-bg)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.arabicName} · {r.totalAyahs}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
