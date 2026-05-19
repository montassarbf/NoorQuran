const ARABIC_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

const ENGLISH_MONTHS = [
  'Muharram', 'Safar', 'Rabi\`al-Awwal', 'Rabi\`ath-Thani',
  'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Sha\`ban',
  'Ramadan', 'Shawwal', 'Dhul Qa\`dah', 'Dhul Hijjah',
];

function gmod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function gregorianToHijri(gy: number, gm: number, gd: number): { year: number; month: number; day: number } {
  let y = gy;
  let m = gm;
  let d = gd;
  if (y > 1582 || (y === 1582 && m > 10) || (y === 1582 && m === 10 && d > 14)) {
    let jd1 = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4);
    let jd2 = Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12);
    let jd3 = Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4);
    let jd = jd1 + jd2 - jd3 + d - 32075;
    let l = jd - 1948442 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    m = Math.floor((24 * l) / 709);
    d = l - Math.floor((709 * m) / 24);
    y = 30 * n + j - 30;
    return { year: y, month: m - 1, day: d };
  }
  return { year: 1, month: 0, day: 1 };
}

export function getHijriDate(date?: Date): { day: number; month: number; year: number; monthName: string; monthNameAr: string } {
  const d = date || new Date();
  const hijri = gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return {
    day: hijri.day,
    month: hijri.month,
    year: hijri.year,
    monthName: ENGLISH_MONTHS[hijri.month],
    monthNameAr: ARABIC_MONTHS[hijri.month],
  };
}

export function formatHijri(date?: Date): string {
  const h = getHijriDate(date);
  return `${h.day} ${h.monthName} ${h.year} AH`;
}
