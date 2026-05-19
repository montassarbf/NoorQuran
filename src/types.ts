export interface WordTranslation {
  text: string;
  language_name: string;
}
export interface WordTransliteration {
  text: string;
  language_name: string;
}
export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: 'word' | 'end' | 'pause';
  text?: string;
  text_uthmani?: string;
  translation: WordTranslation;
  transliteration: WordTransliteration;
  audio_timestamp?: number;
  verse_number?: number;
}
export interface Translation {
  resource_id: number;
  text: string;
}
export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  juz_number: number;
  page_number: number;
  words: Word[];
  translations: Translation[];
}
export interface SurahMeta {
  id: number;
  name: string;
  arabic: string;
  translation: string;
  verses: number;
  revelation: string;
}
export type ThemeId =
  | 'golden-glint' | 'classic-light' | 'silver-lining' | 'vintage-sepia'
  | 'mocha-night' | 'midnight-blue' | 'forest-green' | 'oled-black' | 'dark-luxury';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type DisplayMode = 'normal' | 'continuous';
export type Language = 'en' | 'ar';
export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  country: string;
  region: 'Egypt' | 'Saudi' | 'Tunisia' | 'Other';
  style: string;
  hasCdnAudio: boolean;
  editionId?: string;
  color: string;
  avatar: string;
  imageUrl?: string;
  quranicaudioSlug?: string;
  quranicaudioMp3Dir?: boolean;
  mp3quranServer?: string;
  mp3quranMujawwad?: string;
}
export interface AdhkarItem {
  id: string;
  category: string;
  text: string;
  translation: string;
  transliteration: string;
  count: number;
  reward?: string;
  reference?: string;
  sourceReference?: string;
  sourceArabic?: string;
}
export type QuizType = 'missing-word' | 'surah-id' | 'classic' | 'surah' | 'sahaby';
export interface QuizQuestion {
  type: QuizType;
  surah: number;
  verse: number;
  verseKey?: string;
  fullAyah?: string;
  missingWord?: string;
  missingIndex?: number;
  question: string;
  questionAr?: string;
  options: string[];
  answerIndex: number;
}
export interface Bookmark {
  surahId: number;
  verseNumber: number;
  note: string;
  timestamp: number;
}
export interface MemorizationProgress {
  surahId: number;
  hiddenWords: number[];
}
export interface TasbihCounter {
  id: string;
  label: string;
  arabic: string;
  count: number;
  goal: number;
  transliteration?: string;
}
export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  imsak?: string;
  midnight?: string;
}
export interface AppSettings {
  theme: ThemeId;
  fontSize: FontSize;
  displayMode: DisplayMode;
  language: Language;
  showTransliteration: boolean;
  showWordTranslation: boolean;
  showVerseTranslation: boolean;
  reciter: string;
  lastSurah: number;
  lastVerse: number;
  dailyGoal: number;
}
