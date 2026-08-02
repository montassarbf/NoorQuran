export interface WordFeedback {
  word: string;
  correct: boolean;
}

export interface RecitationGrade {
  accuracy: number;
  targetFeedback: WordFeedback[];
  extraWords: string[];
  spokenText: string;
  targetText: string;
}

export async function transcribeRecitation(audioBlob: Blob, language: string = 'ar'): Promise<string> {
  const res = await fetch(`/api/transcribe?language=${encodeURIComponent(language)}`, {
    method: 'POST',
    headers: { 'Content-Type': audioBlob.type || 'application/octet-stream' },
    body: audioBlob,
  });
  if (!res.ok) {
    let message = 'Transcription failed.';
    try {
      const j = await res.json();
      if (j?.error) message = j.error;
    } catch {}
    throw new Error(message);
  }
  const j = await res.json();
  return j?.text || '';
}

export function normalizeArabicForCompare(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E5\u06E6\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\u0629/g, 'ه')
    .replace(/[^\u0621-\u064A\u0654\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitWords(text: string): string[] {
  return text.split(' ').filter(Boolean);
}

export function gradeRecitation(target: string, spoken: string): RecitationGrade {
  const tWords = splitWords(normalizeArabicForCompare(target));
  const sWords = splitWords(normalizeArabicForCompare(spoken));

  const matchedTarget = new Set<number>();
  const matchedSpoken = new Set<number>();
  let j = 0;
  for (let i = 0; i < tWords.length; i++) {
    for (let k = j; k < sWords.length; k++) {
      if (!matchedSpoken.has(k) && sWords[k] === tWords[i]) {
        matchedTarget.add(i);
        matchedSpoken.add(k);
        j = k + 1;
        break;
      }
    }
  }

  const accuracy = tWords.length ? matchedTarget.size / tWords.length : 0;
  const extraWords = sWords.filter((_, i) => !matchedSpoken.has(i));

  return {
    accuracy,
    targetFeedback: tWords.map((word, i) => ({ word, correct: matchedTarget.has(i) })),
    extraWords,
    spokenText: sWords.join(' '),
    targetText: tWords.join(' '),
  };
}
