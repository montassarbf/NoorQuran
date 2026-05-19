export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
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

export function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = normalizeForMatch(text);
  const normalizedQuery = normalizeForMatch(query);
  if (normalizedQuery.length === 0) return true;
  if (normalizedQuery.length > normalizedText.length) return false;

  let queryIdx = 0;
  for (let i = 0; i < normalizedText.length && queryIdx < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIdx]) {
      queryIdx++;
    }
  }
  return queryIdx === normalizedQuery.length;
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function isCloseMatch(a: string, b: string, threshold: number = 2): boolean {
  const normA = normalizeForMatch(a);
  const normB = normalizeForMatch(b);
  return levenshteinDistance(normA, normB) <= threshold;
}
