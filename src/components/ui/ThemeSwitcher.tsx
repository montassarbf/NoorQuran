import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sun, Moon, Sparkles, ScrollText, Stars, Leaf, Square, Trophy, CloudSun } from 'lucide-react';
import type { ThemeId } from '../../types';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const THEMES: { id: ThemeId; label: string; labelAr: string; icon: LucideIcon; isDark: boolean }[] = [
  { id: 'golden-glint', label: 'Golden Glint', labelAr: 'الذهبي', icon: Sparkles, isDark: false },
  { id: 'classic-light', label: 'Classic Light', labelAr: 'الكلاسيكي', icon: Sun, isDark: false },
  { id: 'silver-lining', label: 'Silver Lining', labelAr: 'الفضي', icon: CloudSun, isDark: false },
  { id: 'vintage-sepia', label: 'Vintage Sepia', labelAr: 'البني', icon: ScrollText, isDark: false },
  { id: 'mocha-night', label: 'Mocha Night', labelAr: 'الليلي', icon: Moon, isDark: true },
  { id: 'midnight-blue', label: 'Midnight Blue', labelAr: 'الأزرق', icon: Stars, isDark: true },
  { id: 'forest-green', label: 'Forest Green', labelAr: 'الأخضر', icon: Leaf, isDark: true },
  { id: 'oled-black', label: 'OLED Black', labelAr: 'الأسود', icon: Square, isDark: true },
  { id: 'dark-luxury', label: 'Dark Luxury', labelAr: 'الفاخر', icon: Trophy, isDark: true },
];

export default function ThemeSwitcher() {
  const { theme, setTheme, language, t } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title={t('theme')}
      >
        <Palette size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className="absolute right-0 top-full mt-2 w-64 z-50 rounded-2xl border shadow-lg overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="p-3">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('theme')}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => { setTheme(th.id); setOpen(false); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all"
                      style={{
                        background: theme === th.id ? 'var(--accent-bg)' : 'transparent',
                        borderColor: theme === th.id ? 'var(--accent)' : 'var(--border)',
                        color: theme === th.id ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      <th.icon size={20} />
                      <span className="text-[10px] leading-tight text-center">
                        {language === 'ar' ? th.labelAr : th.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
