import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { getHijriDate } from '../../services/hijri';
import { useApp } from '../../context/AppContext';

export default function HijriClock() {
  const { language } = useApp();
  const [hijri, setHijri] = useState(() => getHijriDate());

  useEffect(() => {
    const interval = setInterval(() => setHijri(getHijriDate()), 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
      <CalendarDays size={12} />
      <span>
        {hijri.day} {language === 'ar' ? hijri.monthNameAr : hijri.monthName} {hijri.year} {language === 'ar' ? 'هـ' : 'AH'}
      </span>
    </div>
  );
}
