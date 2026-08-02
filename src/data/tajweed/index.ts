import tajweedData from './quran-tajweed.json';
import { TAJWEED_RULE_INFO } from './rules';

export type TajweedAnnotation = [number, number, number];

export interface TajweedVerseEntry {
  surah: number;
  ayah: number;
  text: string;
  annotations: TajweedAnnotation[];
}

export interface TajweedSpan {
  text: string;
  rule: string | null;
}

interface TajweedDataset {
  rules: string[];
  verses: [number, number, string, TajweedAnnotation[]][];
}

const data = tajweedData as unknown as TajweedDataset;

const VERSE_MAP: Map<string, TajweedVerseEntry> = new Map();
for (const [s, a, t, r] of data.verses) {
  VERSE_MAP.set(`${s}:${a}`, { surah: s, ayah: a, text: t, annotations: r });
}

const RULE_NAME = data.rules;

export function getTajweedVerse(surah: number, ayah: number): TajweedVerseEntry | undefined {
  return VERSE_MAP.get(`${surah}:${ayah}`);
}

export function getSurahVerseCountTajweed(surah: number): number {
  let max = 0;
  for (const [s, a] of data.verses) {
    if (s === surah && a > max) max = a;
  }
  return max;
}

function rulePriority(ruleIndex: number): number {
  const name = RULE_NAME[ruleIndex];
  return TAJWEED_RULE_INFO[name]?.priority ?? 999;
}

export function buildTajweedSpans(entry: TajweedVerseEntry): TajweedSpan[] {
  const chars = [...entry.text];
  const n = chars.length;
  const charRule: (number | null)[] = new Array(n).fill(null);

  for (const [start, end, ruleIndex] of entry.annotations) {
    if (ruleIndex < 0 || ruleIndex >= RULE_NAME.length) continue;
    const pri = rulePriority(ruleIndex);
    const s = Math.max(0, Math.min(start, n));
    const e = Math.max(s, Math.min(end, n));
    for (let i = s; i < e; i++) {
      const cur = charRule[i];
      if (cur === null || rulePriority(cur) > pri) {
        charRule[i] = ruleIndex;
      }
    }
  }

  const spans: TajweedSpan[] = [];
  let i = 0;
  while (i < n) {
    const rule = charRule[i];
    let j = i + 1;
    while (j < n && charRule[j] === rule) j++;
    spans.push({ text: chars.slice(i, j).join(''), rule: rule === null ? null : RULE_NAME[rule] });
    i = j;
  }
  return spans;
}

export function getVerseRuleCounts(entry: TajweedVerseEntry): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [, , ruleIndex] of entry.annotations) {
    const name = RULE_NAME[ruleIndex];
    if (!name) continue;
    counts[name] = (counts[name] || 0) + 1;
  }
  return counts;
}

export interface SurahVerseForQuiz {
  surah: number;
  verse: number;
  text: string;
}

export function getSurahVersesForQuiz(surahId: number): SurahVerseForQuiz[] {
  const out: SurahVerseForQuiz[] = [];
  for (const [s, a, t] of data.verses) {
    if (s === surahId) out.push({ surah: s, verse: a, text: t });
  }
  return out;
}
