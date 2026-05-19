import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookOpen, Brain, BookMarked, Trophy, LogOut, Trash2, Camera, Check, X, Pencil } from 'lucide-react';
import { useApp, getStorageKey } from '../context/AppContext';
import { SURAHS } from '../data/surahs';
import { signOut as supabaseSignOut, updateProfile } from '../services/supabase';

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    bookmarks, memorization, versesReadToday,
    settings, updateSettings, isAuthenticated, setIsAuthenticated,
    userName, setUserName, avatarUrl, setAvatarUrl, userEmail,
    language, userId
  } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [saving, setSaving] = useState(false);

  const totalBookmarks = bookmarks.length;
  const totalMemorized = memorization.reduce((acc, m) => acc + m.hiddenWords.length, 0);
  const quizResults = JSON.parse(localStorage.getItem(getStorageKey('quizResults')) || '[]');
  const avgScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((a: number, r: any) => a + (r.score / r.total) * 100, 0) / quizResults.length)
    : 0;

  const getBookmarkedSurahName = (surahId: number) => {
    return SURAHS[surahId - 1]?.name || `Surah ${surahId}`;
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarUrl(dataUrl);
      if (userId) {
        try {
          await updateProfile(userId, { avatar_url: dataUrl });
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    setSaving(true);
    setUserName(nameDraft);
    if (userId) {
      try {
        await updateProfile(userId, { name: nameDraft, avatar_url: avatarUrl || undefined });
      } catch {}
    }
    setSaving(false);
    setEditingName(false);
  };

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
    } catch {}
    setIsAuthenticated(false);
    setUserName('');
    setAvatarUrl('');
    navigate('/');
  };

  const clearAllData = () => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف جميع البيانات؟' : 'Are you sure you want to clear all data?')) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('misbah_'));
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('misbah_last_route');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 pt-28 pb-12">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="relative w-24 h-24 mx-auto mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover border-2"
              style={{ borderColor: 'var(--accent)' }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center border-2"
              style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)' }}>
              <User size={40} style={{ color: 'var(--accent)' }} />
            </div>
          )}
          {isAuthenticated && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 rounded-full border shadow"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <Camera size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        {editingName ? (
          <div className="flex items-center justify-center gap-2 mb-1">
            <input
              type="text" value={nameDraft} autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              className="text-center text-2xl font-bold bg-transparent border-b-2 outline-none"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--accent)' }}
            />
            <button onClick={handleSaveName} disabled={saving}
              className="p-1 rounded" style={{ color: 'var(--accent)' }}>
              <Check size={20} />
            </button>
            <button onClick={() => { setEditingName(false); setNameDraft(userName); }}
              className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {userName || (language === 'ar' ? 'زائر' : 'Guest')}
            </h1>
            {isAuthenticated && (
              <button onClick={() => setEditingName(true)}
                className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }}>
                <Pencil size={16} />
              </button>
            )}
          </div>
        )}

        {userEmail && (
          <p className="text-base mb-1" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
        )}
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isAuthenticated
            ? (language === 'ar' ? '✓ المزامنة نشطة' : '✓ Sync Active')
            : (language === 'ar' ? 'بيانات محلية' : 'Local Data')}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { icon: BookOpen, label: language === 'ar' ? 'اليوم' : 'Today', value: `${versesReadToday}/${settings.dailyGoal}`, color: 'var(--accent)' },
          { icon: BookMarked, label: language === 'ar' ? 'العلامات' : 'Bookmarks', value: `${totalBookmarks}`, color: '#7c3aed' },
          { icon: Brain, label: language === 'ar' ? 'الاختبارات' : 'Quizzes', value: `${quizResults.length} (${avgScore}%)`, color: '#059669' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: stat.color }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            <BookMarked size={18} className="inline-block align-middle me-1" /> {language === 'ar' ? 'آخر العلامات المرجعية' : 'Recent Bookmarks'}
          </h2>
          <div className="space-y-2">
            {bookmarks.slice(-5).reverse().map((bm, idx) => (
              <div key={idx}
                className="flex items-center justify-between px-5 py-3 rounded-xl border text-sm"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {getBookmarkedSurahName(bm.surahId)} {bm.verseNumber}:{bm.verseNumber}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(bm.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memorization Progress */}
      {memorization.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            <Brain size={18} className="inline-block align-middle me-1" /> {language === 'ar' ? 'تقدم الحفظ' : 'Memorization'}
          </h2>
          <div className="space-y-2">
            {memorization.slice(0, 5).map((m, idx) => (
              <div key={idx}
                className="flex items-center justify-between px-5 py-3 rounded-xl border text-sm"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {getBookmarkedSurahName(m.surahId)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {m.hiddenWords.length} {language === 'ar' ? 'كلمات' : 'words'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {isAuthenticated && (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-base font-medium border transition-all"
            style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
          >
            <LogOut size={18} />
            {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        )}
        <button
          onClick={clearAllData}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-base font-medium border transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <Trash2 size={18} />
          {language === 'ar' ? 'حذف البيانات' : 'Clear All Data'}
        </button>
      </div>
    </div>
  );
}
