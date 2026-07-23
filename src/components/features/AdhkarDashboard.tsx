import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Heart, Bed, Sunrise, Star, Check, ChevronLeft,
  Home, Cloud, Activity, Utensils, Droplets, Shirt, Volume2,
  Plane, Shield, Building, BookOpen,
  ChevronRight, RotateCw,
} from 'lucide-react';
import { useApp, getStorageKey } from '../../context/AppContext';
import { ADHKAR, CATEGORIES } from '../../data/adhkar-data';
import type { AdhkarItem } from '../../types';

const ICON_MAP: Record<string, any> = {
  Sun, Moon, Heart, Bed, Sunrise, Star, Home, Cloud, Activity,
  Utensils, Droplets, Shirt, Volume2, Plane, Shield, Building, BookOpen,
};

const STORAGE_KEY = 'adhkar';

function loadCompleted(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(STORAGE_KEY)) || '{}');
  } catch { return {}; }
}

function saveCompleted(data: Record<string, number>) {
  try {
    localStorage.setItem(getStorageKey(STORAGE_KEY), JSON.stringify(data));
  } catch {}
}

export default function AdhkarDashboard() {
  const { language } = useApp();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, number>>(loadCompleted);

  useEffect(() => {
    saveCompleted(completed);
  }, [completed]);

  const items = activeCategory ? ADHKAR.filter((a) => a.category === activeCategory) : [];

  const handleIncrement = (item: AdhkarItem) => {
    setCompleted((prev) => {
      const current = prev[item.id] || 0;
      if (current >= item.count) return prev;
      return { ...prev, [item.id]: current + 1 };
    });
  };

  const handleResetItem = (id: string) => {
    setCompleted((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {language === 'ar' ? 'الأذكار' : 'Adhkar'}
        </h1>
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>
          {language === 'ar' ? 'أذكار وأدعية مأثورة من حصن المسلم' : 'Fortress of the Muslim — Hisnul Muslim'}
        </p>
      </div>

      {/* Categories Grid */}
      {!activeCategory && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Star;
            const count = ADHKAR.filter((a) => a.category === cat.id).length;
            const completedCount = ADHKAR.filter((a) => a.category === cat.id)
              .filter((a) => (completed[a.id] || 0) >= a.count).length;

            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all"
                style={
                  cat.id === 'dhul_hijjah'
                    ? {
                        background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                        borderColor: '#B38728',
                        boxShadow: 'var(--shadow)',
                      }
                    : {
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        boxShadow: 'var(--shadow)',
                      }
                }
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: cat.id === 'dhul_hijjah' ? '#7c2d12' : 'var(--accent-bg)' }}>
                  <Icon size={20} style={{ color: cat.id === 'dhul_hijjah' ? '#FBF5B7' : 'var(--accent)' }} />
                </div>
                <span className="text-sm font-medium text-center" style={{ color: cat.id === 'dhul_hijjah' ? '#3b1f00' : 'var(--text-primary)' }}>
                  {language === 'ar' ? cat.labelAr : cat.labelEn}
                </span>
                <span className="text-xs" style={{ color: cat.id === 'dhul_hijjah' ? '#5c2e00' : 'var(--text-muted)' }}>
                  {completedCount}/{count}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Category Detail */}
      {activeCategory && (
        <>
          <button
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            {language === 'ar' ? <ChevronRight size={16} /> :<ChevronLeft size={16} />}
            {language === 'ar' ? 'العودة' : 'Back'}
          </button>

          <div className="space-y-3">
            {items.map((item) => {
              const current = completed[item.id] || 0;
              const isDone = current >= item.count;
              const progress = Math.min(current / item.count, 1);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border overflow-hidden transition-all"
                  style={
                    activeCategory === 'dhul_hijjah'
                      ? {
                          background: isDone ? 'rgba(191,149,63,0.3)' : 'linear-gradient(to right, rgba(191,149,63,0.12), rgba(252,246,186,0.15), rgba(179,135,40,0.12))',
                          borderColor: isDone ? '#AA771C' : '#B38728',
                        }
                      : {
                          background: isDone ? 'var(--success-bg)' : 'var(--bg-card)',
                          borderColor: isDone ? 'var(--success)' : 'var(--border)',
                        }
                  }
                >
                  <div className="p-4">
                    <p className="font-arabic text-xl leading-relaxed mb-2" style={{ textAlign: 'center', color: activeCategory === 'dhul_hijjah' ? '#3b1f00' : 'var(--text-primary)' }}>
                      {item.text}
                    </p>
                    <p className="text-sm mb-1 text-center" style={{ color: activeCategory === 'dhul_hijjah' ? '#5c2e00' : 'var(--text-secondary)' }}>
                      {item.translation}
                    </p>
                    {item.transliteration && (
                      <p className="text-xs italic mb-2 text-center" style={{ color: activeCategory === 'dhul_hijjah' ? '#7c4400' : 'var(--text-muted)' }}>
                        {item.transliteration}
                      </p>
                    )}

                    {/* Source Reference */}
                    {item.sourceReference && (
                      <p className="text-[10px] text-center mb-2" style={{ color: activeCategory === 'dhul_hijjah' ? '#7c4400' : 'var(--text-muted)' }}>
                        {item.reference && item.reference !== item.sourceReference
                          ? `${item.reference} — `
                          : ''}
                        {item.sourceReference}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <button
                            onClick={() => handleResetItem(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                            style={{
                              background: 'var(--success)',
                              color: 'white',
                            }}
                          >
                            <RotateCw size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleIncrement(item)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                            style={{
                              background: 'var(--accent)',
                              color: 'white',
                            }}
                          >
                            {'+'}
                          </button>
                        )}
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          {current}/{item.count}
                        </span>
                      </div>
                      {item.reward && (
                        <span className="text-[10px] italic px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                          {item.reward}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1 rounded-full mt-2 overflow-hidden"
                      style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress * 100}%`, background: isDone ? 'var(--success)' : 'var(--accent)' }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
