import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useApp } from './AppContext';
import { DEFAULT_RIWAYAH, type RiwayahId } from '../data/mushaf/riwayat';
import { getMushafMaps, getSurahStartPage, getJuzStartPage, MUSH_PAGES } from '../services/mushafApi';

interface MushafContextType {
  riwayah: RiwayahId;
  setRiwayah: (r: RiwayahId) => void;
  currentPage: number;
  goToPage: (page: number) => void;
  goToSurah: (surah: number) => void;
  goToJuz: (juz: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  isLoadingPage: boolean;
}

const MushafContext = createContext<MushafContextType | null>(null);

export function MushafProvider({ children, targetSurah }: { children: ReactNode; targetSurah?: number }) {
  const { settings, updateSettings } = useApp();
  const riwayah = settings.riwayah || DEFAULT_RIWAYAH;
  const [currentPage, setCurrentPage] = useState(() =>
    Math.min(MUSH_PAGES, Math.max(1, settings.lastMushafPage || 1))
  );
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (targetSurah && targetSurah > 0) {
      setIsLoadingPage(true);
      getSurahStartPage(riwayah, Math.min(114, targetSurah))
        .then((page) => {
          setCurrentPage(page);
          updateSettings({ lastMushafPage: page });
        })
        .finally(() => setIsLoadingPage(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSurah]);

  const setRiwayah = useCallback(
    (r: RiwayahId) => updateSettings({ riwayah: r }),
    [updateSettings]
  );

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.min(MUSH_PAGES, Math.max(1, Math.round(page)));
      setCurrentPage(clamped);
      updateSettings({ lastMushafPage: clamped });
    },
    [updateSettings]
  );

  const goToSurah = useCallback(
    (surah: number) => {
      setIsLoadingPage(true);
      getSurahStartPage(riwayah, Math.min(114, Math.max(1, surah)))
        .then((page) => {
          setCurrentPage(page);
          updateSettings({ lastMushafPage: page });
        })
        .finally(() => setIsLoadingPage(false));
    },
    [riwayah, updateSettings]
  );

  const goToJuz = useCallback(
    (juz: number) => {
      setIsLoadingPage(true);
      getJuzStartPage(riwayah, Math.min(30, Math.max(1, juz)))
        .then((page) => {
          setCurrentPage(page);
          updateSettings({ lastMushafPage: page });
        })
        .finally(() => setIsLoadingPage(false));
    },
    [riwayah, updateSettings]
  );

  const nextPage = useCallback(() => {
    const next = Math.min(MUSH_PAGES, currentPage + 1);
    setCurrentPage(next);
    updateSettings({ lastMushafPage: next });
  }, [currentPage, updateSettings]);

  const prevPage = useCallback(() => {
    const next = Math.max(1, currentPage - 1);
    setCurrentPage(next);
    updateSettings({ lastMushafPage: next });
  }, [currentPage, updateSettings]);

  useEffect(() => {
    getMushafMaps(riwayah).catch(() => {});
  }, [riwayah]);

  return (
    <MushafContext.Provider
      value={{ riwayah, setRiwayah, currentPage, goToPage, goToSurah, goToJuz, nextPage, prevPage, isLoadingPage }}
    >
      {children}
    </MushafContext.Provider>
  );
}

export function useMushaf(): MushafContextType {
  const ctx = useContext(MushafContext);
  if (!ctx) throw new Error('useMushaf must be used within MushafProvider');
  return ctx;
}
