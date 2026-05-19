interface TajweedSpan {
  text: string;
  color: string;
  rule: string;
}

export function analyzeTajweed(text: string): TajweedSpan[] {
  const spans: TajweedSpan[] = [];
  let remaining = text;

  const rules: [RegExp, string, string][] = [
    // Madd (elongation) - Alif after fatha
    [/[َ]ا/g, '#e53e3e', 'madd'],
    // Madd - Yaa after kasra
    [/[ِ]ي/g, '#e53e3e', 'madd'],
    // Madd - Waw after damma
    [/[ُ]و/g, '#e53e3e', 'madd'],
    // Qalqalah - letters ق ط ب ج د
    /[قطبجد]/g, '#d69e2e', 'qalqalah'],
    // Ghunnah - noon with shaddah
    [/نّ/g, '#38a169', 'ghunnah'],
    // Ghunnah - meem with shaddah
    [/مّ/g, '#38a169', 'ghunnah'],
    // Ikhfaa - noon sakinah/tanween before certain letters
    [/ن[تثدذزسشصضطظفقك]/g, '#805ad5', 'ikhfaa'],
    // Ikhfaa - tanween
    [/[ًٌٍ][تثدذزسشصضطظفقك]/g, '#805ad5', 'ikhfaa'],
    // Idgham - noon sakinah/tanween before ي ن م و ل ر
    [/ن[ينمولر]/g, '#3182ce', 'idgham'],
    // Iqlab - noon sakinah/tanween before ب
    [/ن[ب]/g, '#dd6b20', 'iqlab'],
    // Heavy letters (tafkheem) - خ ص ض غ ط ق ظ
    /[خصضغطقظ]/g, '#c05621', 'tafkheem'],
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const [pattern, color, rule] of rules) {
      const match = remaining.match(pattern);
      if (match && match.index === 0) {
        spans.push({ text: match[0], color, rule });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      spans.push({ text: remaining[0], color: 'inherit', rule: 'normal' });
      remaining = remaining.slice(1);
    }
  }

  return spans;
}

export function renderTajweed(text: string): string {
  const spans = analyzeTajweed(text);
  return spans
    .map((s) => {
      if (s.color === 'inherit') return s.text;
      return `<span style="color:${s.color}" class="tajweed-${s.rule}">${s.text}</span>`;
    })
    .join('');
}
