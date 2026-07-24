import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Mic, Globe, Music, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RECITERS, REGIONS, getReciterImageUrl } from '../data/reciters-data';

export default function RecitersPage() {
  const navigate = useNavigate();
  const { language } = useApp();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');

  const filtered = RECITERS.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.arabicName.includes(search) ||
      r.country.toLowerCase().includes(search.toLowerCase());
    const matchRegion = region === 'All' || r.region === region;
    return matchSearch && matchRegion;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {language === 'ar' ? 'القراء' : 'Reciters'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {language === 'ar' ? 'اختر قارئاً من أكثر من ٣٠ قارئاً' : 'Choose from 30+ reciters'}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن قارئ...' : 'Search reciters...'}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className="px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: region === r ? 'var(--accent-bg)' : 'transparent',
                borderColor: region === r ? 'var(--accent)' : 'var(--border)',
                color: region === r ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {r === 'All' ? (language === 'ar' ? 'الكل' : 'All') : r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((reciter, idx) => (
          <motion.button
            key={reciter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            onClick={() => navigate(`/reciters/${reciter.id}`)}
            className="rounded-2xl border p-4 transition-all text-left w-full"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={getReciterImageUrl(reciter, 48)}
                alt={reciter.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {reciter.name}
                </p>
                <p className="text-xs font-arabic" style={{ color: 'var(--text-muted)' }}>
                  {reciter.arabicName}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5">
                <Globe size={12} />
                <span>{reciter.country}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Music size={12} />
                <span>{reciter.style}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {reciter.hasCdnAudio ? (
                  <>
                    <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--success)' }}>
                      {language === 'ar' ? 'متاح' : 'Available'}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={12} style={{ color: 'var(--error)' }} />
                    <span style={{ color: 'var(--error)' }}>
                      {language === 'ar' ? 'غير متاح' : 'Unavailable'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Mic size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {language === 'ar' ? 'لا توجد نتائج' : 'No reciters found'}
          </p>
        </div>
      )}
    </div>
  );
}
