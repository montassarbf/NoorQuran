import { MUSH_CDN_BASE, type RiwayahId } from '../data/mushaf/riwayat';

export interface MushafSurahMeta {
  number: number;
  nameArabic: string;
  nameEnglish: string;
  nameTranslation: string;
  ayahCount: number;
  pageNumber: number;
  juzNumber: number;
  headerPosition: number;
}

export interface AyahMarker {
  page: number;
  ayah: number;
  x: number;
  y: number;
}

export interface SurahAyahRef {
  surah: number;
  ayah: number;
  global: number;
}

export interface MushafMaps {
  meta: MushafSurahMeta[];
  surahByNumber: Map<number, MushafSurahMeta>;
  surahGlobalStart: number[];
  pageStartGlobal: number[];
  juzStartPage: number[];
}

export const MUSH_PAGES = 604;

const cache = new Map<string, Promise<unknown>>();

function jsonUrl(riwayah: RiwayahId, file: 'surah' | 'markers'): string {
  return `${MUSH_CDN_BASE}/${riwayah}/kfqc/json/${file}.json`;
}

function svgUrl(riwayah: RiwayahId, page: number): string {
  return `${MUSH_CDN_BASE}/${riwayah}/kfqc/svg/${String(page).padStart(3, '0')}.svg`;
}

function fetchCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit) return hit as Promise<T>;
  const p = loader().catch((err) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, p);
  return p;
}

export function ensureSurahIndex(riwayah: RiwayahId): Promise<MushafSurahMeta[]> {
  return fetchCached(`surah:${riwayah}`, async () => {
    const res = await fetch(jsonUrl(riwayah, 'surah'));
    if (!res.ok) throw new Error(`Mushaf index HTTP ${res.status}`);
    const data = await res.json();
    return data.value ?? data;
  });
}

export function ensureMarkers(riwayah: RiwayahId): Promise<AyahMarker[]> {
  return fetchCached(`markers:${riwayah}`, async () => {
    const res = await fetch(jsonUrl(riwayah, 'markers'));
    if (!res.ok) throw new Error(`Mushaf markers HTTP ${res.status}`);
    const data = await res.json();
    return data.value ?? data;
  });
}

export function fetchSvgPage(riwayah: RiwayahId, page: number): Promise<string> {
  return fetchCached(`svg:${riwayah}:${page}`, async () => {
    const res = await fetch(svgUrl(riwayah, page));
    if (!res.ok) throw new Error(`Mushaf page HTTP ${res.status}`);
    return res.text();
  });
}

// Standard Hafs juz boundary ayahs: [surah, ayah]
const JUZ_START_REF: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148],
  [5, 82], [6, 111], [7, 88], [8, 41], [9, 93], [11, 6],
  [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1],
  [25, 21], [27, 56], [29, 46], [33, 31], [36, 28], [39, 32],
  [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

function computeJuzStartPage(meta: MushafSurahMeta[], pageStartGlobal: number[], surahGlobalStart: number[]): number[] {
  const juzStartPage = new Array(31).fill(1);
  for (let juz = 1; juz <= 30; juz++) {
    const [s, a] = JUZ_START_REF[juz - 1];
    const global = surahGlobalStart[s] + a - 1;
    let page = 1;
    for (let p = 1; p < pageStartGlobal.length; p++) {
      const g = pageStartGlobal[p];
      if (g !== undefined && g <= global) page = p;
      else if (g !== undefined && g > global) break;
    }
    juzStartPage[juz] = page;
  }
  return juzStartPage;
}

export function getMushafMaps(riwayah: RiwayahId): Promise<MushafMaps> {
  return fetchCached(`maps:${riwayah}`, async () => {
    const meta = await ensureSurahIndex(riwayah);
    const markers = await ensureMarkers(riwayah);
    const surahByNumber = new Map<number, MushafSurahMeta>(meta.map((s) => [s.number, s]));
    const surahGlobalStart = new Array(meta.length + 1).fill(0);
    let acc = 1;
    for (const s of meta) {
      surahGlobalStart[s.number] = acc;
      acc += s.ayahCount;
    }
    const pageStartGlobal: number[] = [];
    for (const m of markers) {
      if (pageStartGlobal[m.page] === undefined) pageStartGlobal[m.page] = m.ayah;
    }
    const juzStartPage = computeJuzStartPage(meta, pageStartGlobal, surahGlobalStart);
    return { meta, surahByNumber, surahGlobalStart, pageStartGlobal, juzStartPage };
  });
}

export async function getSurahStartPage(riwayah: RiwayahId, surah: number): Promise<number> {
  const maps = await getMushafMaps(riwayah);
  return maps.surahByNumber.get(surah)?.pageNumber ?? 1;
}

export async function getSurahEndPage(riwayah: RiwayahId, surah: number): Promise<number> {
  const maps = await getMushafMaps(riwayah);
  const idx = maps.meta.findIndex((s) => s.number === surah);
  if (idx === -1) return 1;
  return surahEndPage(maps.meta, idx);
}

function surahEndPage(meta: MushafSurahMeta[], idx: number): number {
  const start = meta[idx].pageNumber;
  for (let i = idx + 1; i < meta.length; i++) {
    if (meta[i].pageNumber > start) return meta[i].pageNumber - 1;
  }
  return MUSH_PAGES;
}

export async function getSurahsOnPage(riwayah: RiwayahId, page: number): Promise<MushafSurahMeta[]> {
  const maps = await getMushafMaps(riwayah);
  return maps.meta.filter((s) => {
    const idx = maps.meta.findIndex((x) => x.number === s.number);
    return s.pageNumber <= page && page <= surahEndPage(maps.meta, idx);
  });
}

export async function globalToSurahAyah(riwayah: RiwayahId, global: number): Promise<SurahAyahRef> {
  const maps = await getMushafMaps(riwayah);
  const n = maps.meta.length;
  let lo = 1;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (maps.surahGlobalStart[mid] <= global) lo = mid;
    else hi = mid - 1;
  }
  return { surah: lo, ayah: global - maps.surahGlobalStart[lo] + 1, global };
}

export async function surahAyahToGlobal(riwayah: RiwayahId, surah: number, ayah: number): Promise<number> {
  const maps = await getMushafMaps(riwayah);
  return maps.surahGlobalStart[surah] + ayah - 1;
}

export async function getPageStartGlobalAyah(riwayah: RiwayahId, page: number): Promise<number> {
  const maps = await getMushafMaps(riwayah);
  return maps.pageStartGlobal[page] ?? 1;
}

export async function getJuzStartPage(riwayah: RiwayahId, juz: number): Promise<number> {
  const maps = await getMushafMaps(riwayah);
  return maps.juzStartPage[juz] ?? 1;
}
