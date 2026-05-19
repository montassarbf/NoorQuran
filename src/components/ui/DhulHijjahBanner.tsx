import { useApp } from '../../context/AppContext';

export default function DhulHijjahBanner() {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="fixed top-0 left-0 right-0 z-[55] pointer-events-none" style={{ height: 56 }}>
      <div
        className="pointer-events-auto border-b flex items-center justify-center h-full py-1 overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
          borderColor: '#B38728',
        }}
      >
        <div className="flex items-center max-w-6xl px-2 md:px-4">
          {isAr ? (
            <p
              className="text-[10px] md:text-xs leading-snug text-center"
              style={{ color: '#3b1f00', fontFamily: "'Traditional Arabic', 'Amiri', serif" }}
              dir="rtl"
            >
              <span className="font-semibold" style={{ color: '#7c2d12' }}>
                العشر الأوائل من ذي الحجة
              </span>
              {' — '}
              <span style={{ color: '#3b1f00' }}>
              قال رسول الله ﷺ: «ما من أيامٍ العملُ الصالحُ فيها أحبُّ إلى اللهِ من هذه الأيام» — يعني أيام العشر.
              قالوا: يا رسول الله، ولا الجهاد في سبيل الله؟ قال: «ولا الجهاد في سبيل الله، إلا رجلٌ خرج بنفسه وماله ثم لم يرجع من ذلك بشيء».
              <span className="opacity-70"> (رواه البخاري ٩٦٩)</span>
              </span>
            </p>
          ) : (
            <p
              className="text-[10px] md:text-xs leading-snug text-center"
              style={{ color: '#3b1f00' }}
            >
              <span className="font-semibold" style={{ color: '#7c2d12' }}>
                First 10 Days of Dhul Hijjah
              </span>
              {' — '}
              The Prophet ﷺ said: "There are no days in which righteous deeds are more
              beloved to Allah than these ten days." They said: "Not even jihad in the
              cause of Allah?" He said: "Not even jihad, except a man who went out with
              his life and wealth and returned with nothing."
              <span className="opacity-70" style={{ color: '#3b1f00' }}> (Bukhari 969)</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
