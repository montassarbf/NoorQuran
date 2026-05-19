import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sunrise, Sun, Sunset, Moon, CloudSun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getNextPrayer, fetchPrayerTimes } from '../../services/prayerApi';
import LocationModal from '../layout/LocationModal';

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_NAMES_AR = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
const PRAYER_ICONS: LucideIcon[] = [Sunrise, Sun, CloudSun, Sunset, Sunset, Moon];

export default function SalahDashboard() {
  const { prayerTimes, setPrayerTimes, userLocation, setUserLocation, language } = useApp();
  const [next, setNext] = useState<{ name: string; time: string; remaining: number } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  useEffect(() => {
    if (!prayerTimes) return;
    const update = () => setNext(getNextPrayer(prayerTimes));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const names = language === 'ar' ? PRAYER_NAMES_AR : PRAYER_NAMES;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
          </h2>
          <button
            onClick={() => setLocationModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
          >
            <MapPin size={10} />
            {userLocation?.city ? userLocation.city.substring(0, 8) : (language === 'ar' ? 'تحديد' : 'Set')}
          </button>
        </div>

        {next && (
          <div className="text-center mb-2">
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'الصلاة القادمة' : 'Next'}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {language === 'ar'
                ? (() => { const m: Record<string, string> = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' }; return m[next.name] || next.name; })()
                : next.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
              {next.time}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          {PRAYER_NAMES.map((name, idx) => {
            const time = prayerTimes ? (prayerTimes as any)[name.toLowerCase()] : null;
            const isNext = next?.name === name;

            return (
              <div
                key={name}
                className="rounded-lg py-1.5 px-1 text-center transition-all border"
                style={{
                  background: isNext ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                  borderColor: isNext ? 'var(--accent)' : 'var(--border)',
                }}
              >
                <PRAYER_ICONS[idx] size={20} className="mx-auto" />
                <p className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {names[idx]}
                </p>
                <p className="text-[10px] font-medium" style={{ color: isNext ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {time || '--:--'}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
    </>
  );
}
