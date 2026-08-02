import type { RiwayahId } from '../../types';

export type { RiwayahId };

export interface Riwayah {
  id: RiwayahId;
  name: string;
  arabicName: string;
  country: string;
  totalAyahs: number;
  totalPages: number;
  note?: string;
}

export const RIWAYAT: Riwayah[] = [
  { id: 'hafs', name: 'Hafs an Asim', arabicName: 'حفص عن عاصم', country: 'Kufa', totalAyahs: 6236, totalPages: 604 },
  { id: 'warsh', name: 'Warsh an Nafi', arabicName: 'ورش عن نافع', country: 'Madinah', totalAyahs: 6214, totalPages: 604 },
  { id: 'qalon', name: 'Qalun an Nafi', arabicName: 'قالون عن نافع', country: 'Madinah', totalAyahs: 6214, totalPages: 604 },
  { id: 'douri', name: 'Ad-Duri an Abu Amr', arabicName: 'الدوري عن أبي عمرو', country: 'Basra', totalAyahs: 6205, totalPages: 604 },
  { id: 'shubah', name: 'Shubah an Asim', arabicName: 'شعبة عن عاصم', country: 'Kufa', totalAyahs: 6236, totalPages: 604 },
];

export const DEFAULT_RIWAYAH: RiwayahId = 'hafs';

export const MUSH_CDN_BASE = 'https://cdn.jsdelivr.net/gh/quranpedia/quran-svg@main/mushafs';

export function getRiwayah(id: RiwayahId): Riwayah {
  return RIWAYAT.find((r) => r.id === id) ?? RIWAYAT[0];
}
