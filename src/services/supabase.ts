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
    bookmarks.map(b => ({ ...b, user_id: userId })),
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

export { isConfigured as isSupabaseConfigured };
