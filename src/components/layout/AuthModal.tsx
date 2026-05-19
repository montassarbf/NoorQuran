import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, UserPlus, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { signIn, signUp, updateProfile } from '../../services/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { setIsAuthenticated, setUserName, language } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const signUpRes = await signUp(email, password, name);
        if (signUpRes.error) throw new Error(signUpRes.error.message);
        let session = signUpRes.data?.session;
        if (!session) {
          const signInRes = await signIn(email, password);
          if (signInRes.error) {
            if (signInRes.error.message === 'Invalid login credentials') {
              throw new Error(language === 'ar'
                ? 'يجب تأكيد البريد الإلكتروني. اذهب إلى Supabase → Authentication → Settings وقم بتعطيل "Confirm email".'
                : 'Email confirmation required. Go to Supabase → Authentication → Settings and disable "Confirm email".');
            }
            throw new Error(signInRes.error.message);
          }
          session = signInRes.data?.session;
        }
        if (session?.user) {
          const { error: profileErr } = await updateProfile(session.user.id, { name });
          if (profileErr) console.error('Profile save error:', profileErr);
        }
        setIsAuthenticated(true);
        setUserName(name);
      } else {
        const signInRes = await signIn(email, password);
        if (signInRes.error) throw new Error(signInRes.error.message);
        const session = signInRes.data?.session;
        if (session?.user) {
          const { error: profileErr } = await updateProfile(session.user.id, { name: name || session.user.user_metadata?.name || '' });
          if (profileErr) console.error('Profile save error:', profileErr);
        }
        setIsAuthenticated(true);
      }
      setName('');
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل المصادقة' : 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 rounded-2xl border shadow-xl p-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {mode === 'signin'
                  ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                  : (language === 'ar' ? 'إنشاء حساب' : 'Sign Up')}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' } as any}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' } as any}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={6}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' } as any}
                  />
                </div>
              </div>
              {error && (
                <p className="text-xs" style={{ color: 'var(--error)' }}>{error}</p>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: 'var(--accent)' }}
              >
                {mode === 'signin' ? <LogIn size={16} /> : <UserPlus size={16} />}
                {loading
                  ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...')
                  : mode === 'signin'
                    ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                    : (language === 'ar' ? 'إنشاء حساب' : 'Sign Up')}
              </button>
            </form>
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="w-full text-center text-xs mt-4 transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              {mode === 'signin'
                ? (language === 'ar' ? 'إنشاء حساب جديد' : 'Create an account')
                : (language === 'ar' ? 'لديك حساب؟ سجل الدخول' : 'Already have an account? Sign in')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
