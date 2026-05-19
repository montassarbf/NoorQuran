import type { Verse, Word, Reciter } from '../types';
import { RECITERS } from '../data/reciters-data';

const BASE_URL = 'https://api.quran.com/api/v4';

export async function fetchVersesByChapter(
  chapterId: number,
  page: number = 1,
  perPage: number = 10,
  translationId: number = 131
): Promise<{ verses: Verse[]; pagination: { total_pages: number; total_records: number; next_page: number | null } }> {
  const url = `${BASE_URL}/verses/by_chapter/${chapterId}?language=en&words=true&word_timestamps=true&translations=${translationId}&word_fields=text_uthmani,text_indopak&page=${page}&per_page=${perPage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchChapterInfo(chapterId: number): Promise<{ chapter: any }> {
  const url = `${BASE_URL}/chapters/${chapterId}?language=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchSurahVersesForQuiz(surahId: number): Promise<{ surah: number; verse: number; text: string }[]> {
  const url = `${BASE_URL}/verses/by_chapter/${surahId}?words=true&word_fields=text_uthmani&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.verses.map((v: any) => ({
    surah: surahId,
    verse: v.verse_number,
    text: v.words.map((w: any) => w.text_uthmani).join(' '),
  }));
}

export function getWordAudioUrl(audioUrl: string): string {
  return `https://audio.qurancdn.com/${audioUrl}`;
}

function getMp3quranServer(r: Reciter): string | undefined {
  if (r.style === 'Mujawwad' && r.mp3quranMujawwad) return r.mp3quranMujawwad;
  return r.mp3quranServer;
}

function getPrimaryServer(r: Reciter): string | undefined {
  const mp3quran = getMp3quranServer(r);
  if (mp3quran) return mp3quran;
  if (r.quranicaudioSlug) {
    const base = `https://download.quranicaudio.com/quran/${r.quranicaudioSlug}`;
    return r.quranicaudioMp3Dir ? `${base}/mp3/` : `${base}/`;
  }
  return undefined;
}

export function getVerseAudioUrl(surahId: number, verseNumber: number, reciter: string = 'Alafasy_128kbps'): string {
  const surah = String(surahId).padStart(3, '0');
  const verse = String(verseNumber).padStart(3, '0');
  const r = RECITERS.find((x) => x.id === reciter);
  const server = r ? getPrimaryServer(r) : undefined;
  if (server) return `${server}${surah}.mp3`;
  return `https://everyayah.com/data/${reciter}/${surah}${verse}.mp3`;
}

export function getSurahAudioUrl(surahId: number, reciter: string): string {
  const surah = String(surahId).padStart(3, '0');
  const r = RECITERS.find((x) => x.id === reciter);
  const server = r ? getPrimaryServer(r) : undefined;
  if (server) return `${server}${surah}.mp3`;
  return `https://everyayah.com/data/${reciter}/${surah}.mp3`;
}

export async function fetchSurahWords(surahId: number, translationId: number = 131): Promise<Word[]> {
  const url = `${BASE_URL}/verses/by_chapter/${surahId}?words=true&word_timestamps=true&word_fields=text_uthmani&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.verses.flatMap((v: any) =>
    v.words.map((w: any) => ({
      ...w,
      verse_number: v.verse_number,
    }))
  );
}

export function getReciterAudioUrl(surahId: number, verseNumber: number, editionId: string): string {
  const surah = String(surahId).padStart(3, '0');
  const verse = String(verseNumber).padStart(3, '0');
  return `https://cdn.islamic.network/quran/audio/128/${editionId}/${surah}${verse}.mp3`;
}

const FALLBACK_QURAN: Record<number, string[]> = {
  1: ['بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'مَـٰلِكِ يَوْمِ ٱلدِّينِ', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ'],
  112: ['قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'ٱللَّهُ ٱلصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُۥ كُفُواً أَحَدٌ'],
  113: ['قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', 'مِن شَرِّ مَا خَلَقَ', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'],
  114: ['قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', 'مَلِكِ ٱلنَّاسِ', 'إِلَـٰهِ ٱلنَّاسِ', 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ', 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ'],
};

const tafsirCache = new Map<string, { verseKey: string; text: string }[]>();

export async function fetchTafsirByChapter(surahId: number, tafsirId: number = 169): Promise<{ verseKey: string; text: string }[]> {
  const cacheKey = `${tafsirId}-${surahId}`;
  if (tafsirCache.has(cacheKey)) return tafsirCache.get(cacheKey)!;

  const all: { verseKey: string; text: string }[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${BASE_URL}/tafsirs/${tafsirId}/by_chapter/${surahId}?page=${page}&per_page=50`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Tafsir API error: ${res.status}`);
    const data = await res.json();
    for (const entry of data.tafsirs) {
      all.push({ verseKey: entry.verse_key, text: entry.text });
    }
    totalPages = data.pagination?.total_pages || 1;
    page++;
  }

  tafsirCache.set(cacheKey, all);
  return all;
}

export async function fetchTafsir(surahId: number, verseNumber: number, tafsirId: number = 16): Promise<string> {
  const entries = await fetchTafsirByChapter(surahId, tafsirId);
  const target = `${surahId}:${verseNumber}`;

  // exact match
  for (const entry of entries) {
    if (entry.verseKey === target) {
      if (entry.text) return entry.text;
      break;
    }
  }

  // scan backward: find closest non-empty entry at or before target
  let last = '';
  for (let i = entries.length - 1; i >= 0; i--) {
    const v = parseInt(entries[i].verseKey.split(':')[1], 10);
    if (entries[i].text && v <= verseNumber) return entries[i].text;
    if (entries[i].text) last = entries[i].text;
  }

  return last;
}

export function getFallbackVerses(chapterId: number, count: number = 10): Verse[] {
  const verses = FALLBACK_QURAN[chapterId];
  if (!verses) return [];
  return verses.slice(0, count).map((text, i) => ({
    id: i + 1,
    verse_number: i + 1,
    verse_key: `${chapterId}:${i + 1}`,
    hizb_number: 1,
    juz_number: 1,
    page_number: 1,
    translations: [{ resource_id: 131, text: '' }],
    words: text.split(/\s+/).map((word, j) => ({
      id: j + 1,
      position: j + 1,
      audio_url: null,
      char_type_name: 'word' as const,
      text: word,
      text_uthmani: word,
      translation: { text: '', language_name: 'en' },
      transliteration: { text: '', language_name: 'en' },
    })),
  }));
}
