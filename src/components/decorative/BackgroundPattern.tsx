import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1604655983671-9d03650f604c?w=1920&q=80',
  'https://images.unsplash.com/photo-1589827577276-65d717348780?w=1920&q=80',
  'https://images.unsplash.com/photo-1649929938487-f1f52b2678a4?w=1920&q=80',
  'https://images.unsplash.com/photo-1590108589108-3600131de843?w=1920&q=80',
  'https://images.unsplash.com/photo-1722189226954-59f3e712160d?w=1920&q=80',
  'https://images.unsplash.com/photo-1650446647974-451d05d2136d?w=1920&q=80',
  'https://images.unsplash.com/photo-1652964287112-438ece0a6acc?w=1920&q=80',
  'https://images.unsplash.com/photo-1591604145021-d877bc5303a8?w=1920&q=80',
  'https://images.unsplash.com/photo-1511652019870-fbd8713560bf?w=1920&q=80',
  'https://images.unsplash.com/photo-1764695623755-6dafd555cba6?w=1920&q=80',
  'https://images.unsplash.com/photo-1667454496584-9838026037af?w=1920&q=80',
  'https://images.unsplash.com/photo-1715931705040-d4998d06dd60?w=1920&q=80',
];
  
export default function BackgroundPattern() {
  const { theme } = useApp();
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const isDark = theme.includes('dark') || theme.includes('night') || theme === 'oled-black';

  useEffect(() => {
    let count = 0;
    BG_IMAGES.forEach((url) => {
      const img = new Image();
      img.onload = () => { count++; if (count === BG_IMAGES.length) setLoaded(true); };
      img.onerror = () => { count++; if (count === BG_IMAGES.length) setLoaded(true); };
      img.src = url;
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % BG_IMAGES.length);
    }, 15000);
    return () => clearTimeout(timer);
  }, [loaded, index]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {BG_IMAGES.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: loaded && i === index ? 1 : 0,
            transition: 'opacity 1.5s ease',
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,${isDark ? 0.65 : 0.55}), rgba(0,0,0,${isDark ? 0.75 : 0.65}))`,
        }}
      />
    </div>
  );
}
