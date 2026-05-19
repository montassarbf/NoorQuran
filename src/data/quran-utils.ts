export function normalizeArabic(text: string): string {
  return text
    .replace(/[آإأ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[\u0610-\u061A]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function removeTashkeel(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

export function getVerseKey(surah: number, verse: number): string {
  return `${surah}:${verse}`;
}

export function parseVerseKey(key: string): { surah: number; verse: number } {
  const [s, v] = key.split(':').map(Number);
  return { surah: s, verse: v };
}

export const fontSizeMap: Record<string, string> = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-3xl sm:text-4xl',
  lg: 'text-4xl sm:text-5xl',
  xl: 'text-5xl sm:text-6xl',
};

export const translationFontSizeMap: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};
