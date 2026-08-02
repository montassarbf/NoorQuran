import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function isConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function signUp(email: string, password: string, name: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function updateProfile(userId: string, updates: { name?: string; avatar_url?: string }) {
  return supabase.from('profiles').upsert(
    { id: userId, ...updates, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
}

export async function getProfile(userId?: string) {
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    userId = session.user.id;
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

export async function syncBookmarks(userId: string, bookmarks: any[]) {
  const { error } = await supabase.from('bookmarks').upsert(
    bookmarks.map(b => ({
      user_id: userId,
      surah_id: b.surahId,
      verse_number: b.verseNumber,
      note: b.note || '',
      timestamp: b.timestamp || Date.now(),
    })),
    { onConflict: 'user_id,surah_id,verse_number' }
  );
  if (error) throw error;
}

export async function getBookmarks(userId: string) {
  const { data, error } = await supabase.from('bookmarks').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function syncSettings(userId: string, settings: any) {
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: userId, ...settings },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

export interface RecitationProgressRow {
  id: number;
  surah_id: number;
  verse_start: number;
  verse_end: number;
  accuracy: number;
  target_words: number;
  missing_words: number;
  extra_words: string | null;
  transcript: string | null;
  created_at: string;
}

export async function syncRecitation(
  userId: string,
  attempt: { surahId: number; verseStart: number; verseEnd: number; accuracy: number; targetWords: number; missingWords: number; extraWords: string[]; rawTranscript: string; timestamp: number }
) {
  const { error } = await supabase.from('recitation_progress').insert({
    user_id: userId,
    surah_id: attempt.surahId,
    verse_start: attempt.verseStart,
    verse_end: attempt.verseEnd,
    accuracy: Math.round(attempt.accuracy * 100),
    target_words: attempt.targetWords,
    missing_words: attempt.missingWords,
    extra_words: attempt.extraWords.join(' ') || null,
    transcript: attempt.rawTranscript || null,
    created_at: new Date(attempt.timestamp).toISOString(),
  });
  if (error) throw error;
}

export async function getRecitationProgress(userId: string, limit: number = 50): Promise<RecitationProgressRow[]> {
  const { data, error } = await supabase
    .from('recitation_progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as RecitationProgressRow[];
}

export { isConfigured as isSupabaseConfigured };
