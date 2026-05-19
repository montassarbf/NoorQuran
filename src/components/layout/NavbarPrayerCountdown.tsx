import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getNextPrayer } from '../../services/prayerApi';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function NavbarPrayerCountdown({ onOpenLocation }: { onOpenLocation: () => void }) {
  const { prayerTimes, language } = useApp();
  const [next, setNext] = useState<{ name: string; time: string; remaining: number } | null>(null);

  useEffect(() => {
    if (!prayerTimes) return;
    const tick = () => {
      const n = getNextPrayer(prayerTimes);
      setNext(n);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerTimes]);

  if (!next) return null;

  return (
    <button
      onClick={onOpenLocation}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
      style={{
        background: 'var(--accent-bg)',
        borderColor: 'var(--accent)',
        color: 'var(--accent)',
      }}
    >
      <Clock size={12} />
      <span className="font-medium">
        {language === 'ar' ? getNameAr(next.name) : next.name}
      </span>
      <span className="tabular-nums">{formatTime(Math.round(next.remaining * 60))}</span>
    </button>
  );
}

function getNameAr(name: string): string {
  const map: Record<string, string> = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
  return map[name] || name;
}
