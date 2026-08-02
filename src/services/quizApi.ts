import type { QuizQuestion } from '../types';

export interface AiQuizRequest {
  count?: number;
  surahId?: number;
  surahName?: string;
  language?: 'ar' | 'en';
}

function sanitizeOptions(options: any): string[] {
  if (!Array.isArray(options)) return [];
  const out: string[] = [];
  for (const o of options) {
    const s = typeof o === 'string' ? o.trim() : o?.text ? String(o.text).trim() : '';
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

function toQuestion(raw: any, lang: 'ar' | 'en', surahId?: number): QuizQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const enQ = typeof raw.question === 'string' ? raw.question.trim() : '';
  const arQ = typeof raw.questionAr === 'string' ? raw.questionAr.trim() : '';
  if (!enQ && !arQ) return null;

  const optionsEn = sanitizeOptions(raw.options);
  const optionsAr = sanitizeOptions(raw.optionsAr);
  const useAr = lang === 'ar' && optionsAr.length >= 2;
  const options = useAr ? optionsAr : optionsEn;
  if (options.length < 2) return null;

  const answerIndex = Number(raw.answerIndex);
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) return null;

  const enE = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  const arE = typeof raw.explanationAr === 'string' ? raw.explanationAr.trim() : '';

  return {
    type: 'ai',
    surah: surahId || 1,
    verse: 1,
    question: lang === 'ar' ? arQ || enQ : enQ || arQ,
    questionAr: arQ || enQ,
    options,
    answerIndex,
    explanation: lang === 'ar' ? arE || enE : enE || arE,
  };
}

export async function generateAiQuestions(req: AiQuizRequest): Promise<QuizQuestion[]> {
  const res = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      count: req.count || 10,
      surahId: req.surahId,
      surahName: req.surahName,
      language: req.language || 'en',
    }),
  });
  if (!res.ok) {
    let message = 'AI quiz generation failed.';
    try {
      const j = await res.json();
      if (j?.error) message = j.error;
    } catch {}
    throw new Error(message);
  }
  const j = await res.json();
  const lang: 'ar' | 'en' = req.language || 'en';
  const list: any[] = Array.isArray(j?.questions) ? j.questions : [];
  const questions: QuizQuestion[] = [];
  for (const raw of list) {
    const q = toQuestion(raw, lang, req.surahId);
    if (q) questions.push(q);
  }
  return questions;
}
