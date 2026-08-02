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
  const body = Buffer.concat(chunks);

  if (!body.length) {
    res.status(400).json({ error: 'Empty audio body.' });
    return;
  }

  let audioData = body;
  let mime = (req.headers['content-type'] || '').split(';')[0].trim() || 'audio/webm';

  const contentType = req.headers['content-type'] || '';
  if (contentType.toLowerCase().includes('multipart/form-data')) {
    const extracted = extractMultipartFile(body, contentType);
    if (extracted) {
      audioData = extracted.data;
      mime = extracted.mime;
    }
  }

  const language = typeof req.query?.language === 'string' ? req.query.language : 'ar';

  const form = new FormData();
  const ext = mime.includes('mp4') ? 'm4a' : mime.includes('mp3') ? 'mp3' : mime.includes('wav') ? 'wav' : 'webm';
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'json');
  form.append('language', language);
  form.append('file', new File([audioData], `recitation.${ext}`, { type: mime }));

  const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const text = await groqRes.text();
  if (!groqRes.ok) {
    let message = 'Transcription failed.';
    try {
      const j = JSON.parse(text);
      message = j?.error?.message || message;
    } catch {}
    res.status(502).json({ error: message });
    return;
  }

  let transcript = '';
  try {
    const j = JSON.parse(text);
    transcript = j?.text || '';
  } catch {
    transcript = text;
  }

  res.status(200).json({ text: transcript });
}

function extractMultipartFile(body: Buffer, contentType: string): { data: Buffer; mime: string } | null {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!m) return null;
  const boundary = `--${m[1] || m[2]}`;
  const text = body.toString('latin1');
  const parts = text.split(boundary);
  for (const part of parts) {
    if (!part.startsWith('\r\n')) continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd < 0) continue;
    const headers = part.slice(0, headerEnd);
    if (!/name="(file|audio)"/.test(headers)) continue;
    const cm = /content-type:\s*([^\r\n]+)/i.exec(headers);
    const mime = cm ? cm[1].trim() : 'audio/webm';
    const content = part.slice(headerEnd + 4).replace(/\r\n$/, '');
    return { data: Buffer.from(content, 'latin1'), mime };
  }
  return null;
}
