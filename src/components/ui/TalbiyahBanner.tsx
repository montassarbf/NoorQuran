import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TALBIYAH_URL = 'https://archive.org/download/TalbiyahByMuadhinsOfHaramain/Talbiyah.mp3';

export default function TalbiyahBanner() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!isHome) {
      const a = audioRef.current;
      if (a) { a.pause(); a.src = ''; audioRef.current = null; setPlaying(false); }
      return;
    }
    const audio = new Audio(TALBIYAH_URL);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    audio.play().then(() => setPlaying(true)).catch(() => {});
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setPlaying(false);
    };
  }, [isHome]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play().catch(() => {});
    }
    setPlaying(!playing);
  }

  if (!isHome) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      <div className="relative">
        {/* Pulsing ring */}
        {playing && (
          <>
            <div className="absolute -inset-2 rounded-full animate-ping" style={{
              background: `color-mix(in srgb, var(--accent) 15%, transparent)`,
              border: `2px solid color-mix(in srgb, var(--accent) 25%, transparent)`,
            }} />
            <div className="absolute -inset-4 rounded-full animate-ping" style={{
              background: `color-mix(in srgb, var(--accent) 8%, transparent)`,
              border: `1px solid color-mix(in srgb, var(--accent) 15%, transparent)`,
              animationDelay: '0.3s',
              animationDuration: '2.5s',
            }} />
          </>
        )}
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer relative"
          style={{
            background: playing
              ? `color-mix(in srgb, var(--accent) 25%, var(--bg-card))`
              : `color-mix(in srgb, var(--accent) 20%, var(--bg-card))`,
            border: playing
              ? `2px solid color-mix(in srgb, var(--accent) 50%, transparent)`
              : `1px solid color-mix(in srgb, var(--accent) 30%, transparent)`,
            color: 'var(--accent)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
    </div>
  );
}
