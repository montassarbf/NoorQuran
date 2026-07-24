import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getWorkingReciters } from '../../data/reciters-data';
import type { FontSize, DisplayMode } from '../../types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, t } = useApp();
  const { fontSize, displayMode, showTransliteration, showWordTranslation, showVerseTranslation, reciter } = settings;
  const workingReciters = getWorkingReciters();

  const sizes: FontSize[] = ['sm', 'md', 'lg', 'xl'];
  const modes: { id: DisplayMode; labelEn: string; labelAr: string }[] = [
    { id: 'normal', labelEn: 'Verse by Verse', labelAr: 'آية آية' },
    { id: 'continuous', labelEn: 'Continuous', labelAr: 'مستمر' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40" onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-14 bottom-0 w-80 max-sm:w-[calc(100vw-1rem)] z-50 flex flex-col border-l shadow-2xl overflow-y-auto"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings')}</span>
              <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-5">
              {/* Font Size */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{t('fontSize')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateSettings({ fontSize: s })}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all"
                      style={{
                        background: fontSize === s ? 'var(--accent-bg)' : 'transparent',
                        borderColor: fontSize === s ? 'var(--accent)' : 'var(--border)',
                        color: fontSize === s ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      <Type size={s === 'sm' ? 10 : s === 'md' ? 13 : s === 'lg' ? 16 : 19} />
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Mode */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{t('displayMode')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updateSettings({ displayMode: m.id })}
                      className="py-2 px-1 rounded-xl border text-xs font-medium transition-all"
                      style={{
                        background: displayMode === m.id ? 'var(--accent-bg)' : 'transparent',
                        borderColor: displayMode === m.id ? 'var(--accent)' : 'var(--border)',
                        color: displayMode === m.id ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      {m.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Toggles */}
              <div className="space-y-2 p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                {[
                  { key: 'showTransliteration', label: 'Show Transliteration' },
                  { key: 'showWordTranslation', label: 'Word-by-Word Translation' },
                  { key: 'showVerseTranslation', label: 'Full Verse Translation' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <button
                      onClick={() => updateSettings({ [key]: !(settings as any)[key] })}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ background: (settings as any)[key] ? 'var(--accent)' : 'var(--border)' }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                        style={{ left: (settings as any)[key] ? '22px' : '2px' }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Reciter */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{t('reciter')}</p>
                <select
                  value={reciter}
                  onChange={(e) => updateSettings({ reciter: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {workingReciters.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
