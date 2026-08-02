const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  let body: any = {};
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    body = {};
  }

  const count = Math.min(Math.max(Number(body.count) || 10, 1), 12);
  const language = body.language === 'ar' ? 'ar' : 'en';
  const surahId = body.surahId ? Number(body.surahId) : null;
  const surahName = typeof body.surahName === 'string' ? body.surahName.trim() : '';

  const system = [
    'You are an expert Quran quiz generator for an Islamic learning app.',
    'Respond ONLY with a single JSON object of this exact shape:',
    '{"questions":[{"question":"English question","questionAr":"Arabic question","options":["4 English options"],"optionsAr":["4 Arabic options, same order"],"answerIndex":0,"explanation":"English explanation","explanationAr":"Arabic explanation"}]}',
    'Rules:',
    '- Generate EXACTLY the requested number of questions.',
    '- Every question must have exactly 4 options in "options" and 4 matching options in "optionsAr".',
    '- "answerIndex" must be the 0-based index of the correct option (must be valid).',
    '- Keep options short (a few words). Do not repeat the correct answer among options.',
    '- Be accurate, respectful, and faithful to authentic Quranic knowledge. Avoid speculation.',
    '- Vary question types: context/theme, word meaning, notable verses, and general knowledge.',
    '- Questions must be genuinely educational, engaging, and not trivially guessable.',
  ].join('\n');

  let topic = 'general Quranic knowledge across the whole Quran';
  if (surahName) topic = `Surah ${surahName} (its themes, key verses, meanings, and context)`;
  if (surahId) topic += ` using only authentic material about surah number ${surahId}`;

  const user = [
    `Language: ${language === 'ar' ? 'Arabic' : 'English'}`,
    `Topic: ${topic}`,
    `Number of questions: ${count}`,
    'Return only the JSON object, no extra text.',
  ].join('\n');

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  const text = await groqRes.text();
  if (!groqRes.ok) {
    let message = 'AI quiz generation failed.';
    try {
      const j = JSON.parse(text);
      message = j?.error?.message || message;
    } catch {}
    res.status(502).json({ error: message });
    return;
  }

  let questions: any[] = [];
  try {
    const j = JSON.parse(text);
    const content: string = j?.choices?.[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    const parsed = JSON.parse(jsonStr);
    questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch {
    res.status(502).json({ error: 'Invalid AI response.' });
    return;
  }

  res.status(200).json({ questions });
}
