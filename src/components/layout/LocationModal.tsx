import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Crosshair } from 'lucide-react';
import { searchCities, fetchPrayerTimes } from '../../services/prayerApi';
import { useApp } from '../../context/AppContext';

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LocationModal({ open, onClose }: LocationModalProps) {
  const { setPrayerTimes, setUserLocation, language, t } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ name: string; lat: number; lon: number; country: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const cities = await searchCities(query);
      setResults(cities);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (city: string, lat: number, lon: number) => {
    try {
      const times = await fetchPrayerTimes(lat, lon);
      setPrayerTimes(times);
      setUserLocation({ city, lat, lon });
      onClose();
    } catch {}
  };

  const handleDetect = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const times = await fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
          setPrayerTimes(times);
          setUserLocation({ city: 'Current Location', lat: pos.coords.latitude, lon: pos.coords.longitude });
          onClose();
        } catch {}
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 rounded-2xl border shadow-xl p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('location')}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <button
              onClick={handleDetect}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border mb-4 text-sm font-medium transition-all"
              style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              <Crosshair size={16} />
              {detecting ? `${t('loading')}...` : t('detectLocation')}
            </button>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchLocation')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--accent)' } as any}
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                {t('searchLocation')?.split(' ')[0] || 'Search'}
              </button>
            </div>
            {loading && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(r.name, r.lat, r.lon)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <MapPin size={14} style={{ color: 'var(--accent)' }} />
                  <span>{r.name}, {r.country}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
