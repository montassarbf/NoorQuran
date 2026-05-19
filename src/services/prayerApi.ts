import type { PrayerTimes } from '../types';

interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.features.map((f: any) => ({
    name: f.properties.name,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    country: f.properties.country || '',
  }));
}

export async function fetchPrayerTimes(lat: number, lon: number, date?: Date): Promise<PrayerTimes> {
  const d = date || new Date();
  const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Prayer times API failed');
  const data = await res.json();
  const t = data.data.timings;
  return {
    fajr: t.Fajr,
    sunrise: t.Sunrise,
    dhuhr: t.Dhuhr,
    asr: t.Asr,
    maghrib: t.Maghrib,
    isha: t.Isha,
    imsak: t.Imsak,
    midnight: t.Midnight,
  };
}

export function getNextPrayer(times: PrayerTimes): { name: string; time: string; remaining: number } | null {
  const now = new Date();
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  const prayers: { name: string; time: string }[] = [
    { name: 'Fajr', time: times.fajr },
    { name: 'Sunrise', time: times.sunrise },
    { name: 'Dhuhr', time: times.dhuhr },
    { name: 'Asr', time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isha', time: times.isha },
  ];

  for (const prayer of prayers) {
    const prayerMinutes = toMinutes(prayer.time);
    if (prayerMinutes > currentMinutes) {
      return {
        name: prayer.name,
        time: prayer.time,
        remaining: prayerMinutes - currentMinutes,
      };
    }
  }

  const firstPrayer = prayers[0];
  const firstMinutes = toMinutes(firstPrayer.time) + 1440;
  return {
    name: firstPrayer.name,
    time: firstPrayer.time,
    remaining: firstMinutes - currentMinutes,
  };
}
