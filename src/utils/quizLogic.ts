import type { QuizQuestion } from '../types';
import type { LucideIcon } from 'lucide-react';
import { FileText, BookOpen, Lightbulb, ScrollText, Users } from 'lucide-react';
import { normalizeForMatch } from './fuzzyMatch';
import { SURAHS } from '../data/surahs';
import { SAHABA_QUESTIONS } from '../data/sahaba-data';
import { getStorageKey } from '../context/AppContext';

const AYAH_POOL: { surah: number; verse: number; text: string }[] = [
  // ═══ JUZ 30 (Surahs 78-114) → EASY ═══
  { surah: 78, verse: 1, text: 'عَمَّ يَتَسَآءَلُونَ' },
  { surah: 78, verse: 2, text: 'عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ' },
  { surah: 78, verse: 3, text: 'ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ' },
  { surah: 80, verse: 1, text: 'عَبَسَ وَتَوَلَّىٰٓ' },
  { surah: 80, verse: 2, text: 'أَن جَآءَهُ ٱلْأَعْمَىٰ' },
  { surah: 80, verse: 3, text: 'وَمَا يُدْرِيكَ لَعَلَّهُۥ يَزَّكَّىٰٓ' },
  { surah: 80, verse: 4, text: 'أَوْ يَذَّكَّرُ فَتَنفَعَهُ ٱلذِّكْرَىٰٓ' },
  { surah: 80, verse: 5, text: 'أَمَّا مَنِ ٱسْتَغْنَىٰ' },
  { surah: 85, verse: 1, text: 'وَٱلسَّمَآءِ ذَاتِ ٱلْبُرُوجِ' },
  { surah: 85, verse: 2, text: 'وَٱلْيَوْمِ ٱلْمَوْعُودِ' },
  { surah: 85, verse: 3, text: 'وَشَاهِدٍ وَمَشْهُودٍ' },
  { surah: 85, verse: 4, text: 'قُتِلَ أَصْحَـٰبُ ٱلْأُخْدُودِ' },
  { surah: 95, verse: 1, text: 'وَٱلتِّينِ وَٱلزَّيْتُونِ' },
  { surah: 95, verse: 2, text: 'وَطُورِ سِينِينَ' },
  { surah: 95, verse: 3, text: 'وَهَـٰذَا ٱلْبَلَدِ ٱلْأَمِينِ' },
  { surah: 95, verse: 4, text: 'لَقَدْ خَلَقْنَا ٱلْإِنسَـٰنَ فِىٓ أَحْسَنِ تَقْوِيمٍ' },
  { surah: 95, verse: 5, text: 'ثُمَّ رَدَدْنَـٰهُ أَسْفَلَ سَـٰفِلِينَ' },
  { surah: 95, verse: 6, text: 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍ' },
  { surah: 96, verse: 1, text: 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ' },
  { surah: 96, verse: 2, text: 'خَلَقَ ٱلْإِنسَـٰنَ مِنْ عَلَقٍ' },
  { surah: 96, verse: 3, text: 'ٱقْرَأْ وَرَبُّكَ ٱلْأَكْرَمُ' },
  { surah: 96, verse: 4, text: 'ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ' },
  { surah: 96, verse: 5, text: 'عَلَّمَ ٱلْإِنسَـٰنَ مَا لَمْ يَعْلَمْ' },
  { surah: 97, verse: 1, text: 'إِنَّآ أَنزَلْنَـٰهُ فِى لَيْلَةِ ٱلْقَدْرِ' },
  { surah: 97, verse: 2, text: 'وَمَآ أَدْرَىٰكَ مَا لَيْلَةُ ٱلْقَدْرِ' },
  { surah: 97, verse: 3, text: 'لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ' },
  { surah: 97, verse: 4, text: 'تَنَزَّلُ ٱلْمَلَـٰٓئِكَةُ وَٱلرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ' },
  { surah: 97, verse: 5, text: 'سَلَـٰمٌ هِىَ حَتَّىٰ مَطْلَعِ ٱلْفَجْرِ' },
  { surah: 99, verse: 1, text: 'إِذَا زُلْزِلَتِ ٱلْأَرْضُ زِلْزَالَهَا' },
  { surah: 99, verse: 2, text: 'وَأَخْرَجَتِ ٱلْأَرْضُ أَثْقَالَهَا' },
  { surah: 99, verse: 3, text: 'وَقَالَ ٱلْإِنسَـٰنُ مَا لَهَا' },
  { surah: 99, verse: 4, text: 'يَوْمَئِذٍ تُحَدِّثُ أَخْبَارَهَا' },
  { surah: 99, verse: 7, text: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ' },
  { surah: 99, verse: 8, text: 'وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُۥ' },
  { surah: 102, verse: 1, text: 'أَلْهَىٰكُمُ ٱلتَّكَاثُرُ' },
  { surah: 102, verse: 2, text: 'حَتَّىٰ زُرْتُمُ ٱلْمَقَابِرَ' },
  { surah: 102, verse: 3, text: 'كَلَّا سَوْفَ تَعْلَمُونَ' },
  { surah: 102, verse: 4, text: 'ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ' },
  { surah: 102, verse: 5, text: 'كَلَّا لَوْ تَعْلَمُونَ عِلْمَ ٱلْيَقِينِ' },
  { surah: 102, verse: 6, text: 'لَتَرَوُنَّ ٱلْجَحِيمَ' },
  { surah: 103, verse: 1, text: 'وَٱلْعَصْرِ' },
  { surah: 103, verse: 2, text: 'إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ' },
  { surah: 103, verse: 3, text: 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ' },
  { surah: 105, verse: 1, text: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَـٰبِ ٱلْفِيلِ' },
  { surah: 105, verse: 2, text: 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِى تَضْلِيلٍ' },
  { surah: 105, verse: 3, text: 'وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ' },
  { surah: 105, verse: 4, text: 'تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ' },
  { surah: 105, verse: 5, text: 'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ' },
  { surah: 106, verse: 1, text: 'لِإِيلَـٰفِ قُرَيْشٍ' },
  { surah: 106, verse: 2, text: 'إِۦلَـٰفِهِمْ رِحْلَةَ ٱلشِّتَآءِ وَٱلصَّيْفِ' },
  { surah: 106, verse: 3, text: 'فَلْيَعْبُدُوا۟ رَبَّ هَـٰذَا ٱلْبَيْتِ' },
  { surah: 106, verse: 4, text: 'ٱلَّذِىٓ أَطْعَمَهُم مِّن جُوعٍ وَءَامَنَهُم مِّنْ خَوْفٍ' },
  { surah: 107, verse: 1, text: 'أَرَءَيْتَ ٱلَّذِى يُكَذِّبُ بِٱلدِّينِ' },
  { surah: 107, verse: 2, text: 'فَذَٰلِكَ ٱلَّذِى يَدُعُّ ٱلْيَتِيمَ' },
  { surah: 107, verse: 3, text: 'وَلَا يَحُضُّ عَلَىٰ طَعَامِ ٱلْمِسْكِينِ' },
  { surah: 107, verse: 4, text: 'فَوَيْلٌ لِّلْمُصَلِّينَ' },
  { surah: 107, verse: 5, text: 'ٱلَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ' },
  { surah: 108, verse: 1, text: 'إِنَّآ أَعْطَيْنَـٰكَ ٱلْكَوْثَرَ' },
  { surah: 108, verse: 2, text: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ' },
  { surah: 108, verse: 3, text: 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ' },
  { surah: 109, verse: 1, text: 'قُلْ يَـٰأَيُّهَا ٱلْكَـٰفِرُونَ' },
  { surah: 109, verse: 2, text: 'لَآ أَعْبُدُ مَا تَعْبُدُونَ' },
  { surah: 109, verse: 3, text: 'وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ' },
  { surah: 110, verse: 1, text: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ' },
  { surah: 110, verse: 2, text: 'وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا' },
  { surah: 110, verse: 3, text: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ إِنَّهُۥ كَانَ تَوَّابًا' },
  { surah: 111, verse: 1, text: 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ' },
  { surah: 111, verse: 2, text: 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ' },
  { surah: 111, verse: 3, text: 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ' },
  { surah: 111, verse: 4, text: 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ' },
  { surah: 111, verse: 5, text: 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍ' },
  { surah: 112, verse: 1, text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ' },
  { surah: 112, verse: 2, text: 'ٱللَّهُ ٱلصَّمَدُ' },
  { surah: 112, verse: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
  { surah: 112, verse: 4, text: 'وَلَمْ يَكُن لَّهُۥ كُفُواً أَحَدٌ' },
  { surah: 113, verse: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ' },
  { surah: 113, verse: 2, text: 'مِن شَرِّ مَا خَلَقَ' },
  { surah: 113, verse: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ' },
  { surah: 113, verse: 4, text: 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ' },
  { surah: 113, verse: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ' },
  { surah: 114, verse: 1, text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ' },
  { surah: 114, verse: 2, text: 'مَلِكِ ٱلنَّاسِ' },
  { surah: 114, verse: 3, text: 'إِلَـٰهِ ٱلنَّاسِ' },
  { surah: 114, verse: 4, text: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ' },
  { surah: 114, verse: 5, text: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ' },
  { surah: 114, verse: 6, text: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ' },
  { surah: 87, verse: 1, text: 'سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى' },
  { surah: 87, verse: 2, text: 'ٱلَّذِى خَلَقَ فَسَوَّىٰ' },
  { surah: 87, verse: 3, text: 'وَٱلَّذِى قَدَّرَ فَهَدَىٰ' },
  { surah: 87, verse: 4, text: 'وَٱلَّذِىٓ أَخْرَجَ ٱلْمَرْعَىٰ' },
  { surah: 87, verse: 5, text: 'فَجَعَلَهُۥ غُثَآءً أَحْوَىٰ' },
  { surah: 93, verse: 1, text: 'وَٱلضُّحَىٰ' },
  { surah: 93, verse: 2, text: 'وَٱلَّيْلِ إِذَا سَجَىٰ' },
  { surah: 93, verse: 3, text: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ' },
  { surah: 93, verse: 4, text: 'وَلَلْـَٔاخِرَةُ خَيْرٌ لَّكَ مِنَ ٱلْأُولَىٰ' },
  { surah: 93, verse: 5, text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ' },
  { surah: 94, verse: 1, text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ' },
  { surah: 94, verse: 2, text: 'وَوَضَعْنَا عَنكَ وِزْرَكَ' },
  { surah: 94, verse: 3, text: 'ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ' },
  { surah: 94, verse: 4, text: 'وَرَفَعْنَا لَكَ ذِكْرَكَ' },
  { surah: 94, verse: 5, text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا' },
  { surah: 94, verse: 6, text: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا' },
  { surah: 94, verse: 7, text: 'فَإِذَا فَرَغْتَ فَٱنصَبْ' },
  { surah: 94, verse: 8, text: 'وَإِلَىٰ رَبِّكَ فَٱرْغَب' },
  { surah: 100, verse: 1, text: 'وَٱلْعَـٰدِيَـٰتِ ضَبْحًا' },
  { surah: 100, verse: 2, text: 'فَٱلْمُورِيَـٰتِ قَدْحًا' },
  { surah: 100, verse: 3, text: 'فَٱلْمُغِيرَٰتِ صُبْحًا' },
  { surah: 100, verse: 4, text: 'فَأَثَرْنَ بِهِۦ نَقْعًا' },
  { surah: 100, verse: 5, text: 'فَوَسَطْنَ بِهِۦ جَمْعًا' },
  { surah: 100, verse: 6, text: 'إِنَّ ٱلْإِنسَـٰنَ لِرَبِّهِۦ لَكَنُودٌ' },

  // ═══ JUZ 20-29 (Surahs 28-77) → MEDIUM ═══
  { surah: 36, verse: 2, text: 'وَٱلْقُرْءَانِ ٱلْحَكِيمِ' },
  { surah: 36, verse: 3, text: 'إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ' },
  { surah: 36, verse: 5, text: 'تَنزِيلَ ٱلْعَزِيزِ ٱلرَّحِيمِ' },
  { surah: 36, verse: 6, text: 'لِتُنذِرَ قَوْمًا مَّآ أُنذِرَ ءَابَآؤُهُمْ فَهُمْ غَـٰفِلُونَ' },
  { surah: 36, verse: 7, text: 'لَقَدْ حَقَّ ٱلْقَوْلُ عَلَىٰٓ أَكْثَرِهِمْ فَهُمْ لَا يُؤْمِنُونَ' },
  { surah: 36, verse: 8, text: 'إِنَّا جَعَلْنَا فِىٓ أَعْنَـٰقِهِمْ أَغْلَـٰلًا فَهِىَ إِلَى ٱلْأَذْقَانِ فَهُم مُّقْمَحُونَ' },
  { surah: 36, verse: 9, text: 'وَجَعَلْنَا مِنۢ بَيْنِ أَيْدِيهِمْ سَدًّا وَمِنْ خَلْفِهِمْ سَدًّا فَأَغْشَيْنَـٰهُمْ فَهُمْ لَا يُبْصِرُونَ' },
  { surah: 44, verse: 2, text: 'وَٱلْكِتَـٰبِ ٱلْمُبِينِ' },
  { surah: 44, verse: 3, text: 'إِنَّآ أَنزَلْنَـٰهُ فِى لَيْلَةٍ مُّبَـٰرَكَةٍ إِنَّا كُنَّا مُنذِرِينَ' },
  { surah: 44, verse: 38, text: 'وَمَا خَلَقْنَا ٱلسَّمَـٰوَاتِ وَٱلْأَرْضَ وَمَا بَيْنَهُمَا لَـٰعِبِينَ' },
  { surah: 48, verse: 1, text: 'إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا' },
  { surah: 48, verse: 2, text: 'لِّيَغْفِرَ لَكَ ٱللَّهُ مَا تَقَدَّمَ مِن ذَنۢبِكَ وَمَا تَأَخَّرَ وَيُتِمَّ نِعْمَتَهُۥ عَلَيْكَ وَيَهْدِيَكَ صِرَٰطًا مُّسْتَقِيمًا' },
  { surah: 48, verse: 3, text: 'وَيَنصُرَكَ ٱللَّهُ نَصْرًا عَزِيزًا' },
  { surah: 48, verse: 29, text: 'مُّحَمَّدٌ رَّسُولُ ٱللَّهِ وَٱلَّذِينَ مَعَهُۥٓ أَشِدَّآءُ عَلَى ٱلْكُفَّارِ رُحَمَآءُ بَيْنَهُمْ' },
  { surah: 49, verse: 9, text: 'وَإِن طَآئِفَتَانِ مِنَ ٱلْمُؤْمِنِينَ ٱقْتَتَلُوا۟ فَأَصْلِحُوا۟ بَيْنَهُمَا' },
  { surah: 49, verse: 13, text: 'يَـٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقْنَـٰكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَـٰكُمْ شُعُوبًا وَقَبَآئِلَ لِتَعَارَفُوا۟' },
  { surah: 55, verse: 1, text: 'ٱلرَّحْمَـٰنُ' },
  { surah: 55, verse: 2, text: 'عَلَّمَ ٱلْقُرْءَانَ' },
  { surah: 55, verse: 3, text: 'خَلَقَ ٱلْإِنسَـٰنَ' },
  { surah: 55, verse: 4, text: 'عَلَّمَهُ ٱلْبَيَانَ' },
  { surah: 55, verse: 5, text: 'ٱلشَّمْسُ وَٱلْقَمَرُ بِحُسْبَانٍ' },
  { surah: 55, verse: 6, text: 'وَٱلنَّجْمُ وَٱلشَّجَرُ يَسْجُدَانِ' },
  { surah: 55, verse: 26, text: 'كُلُّ مَنْ عَلَيْهَا فَانٍ' },
  { surah: 55, verse: 27, text: 'وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو ٱلْجَلَـٰلِ وَٱلْإِكْرَامِ' },
  { surah: 55, verse: 33, text: 'يَـٰمَعْشَرَ ٱلْجِنِّ وَٱلْإِنسِ إِنِ ٱسْتَطَعْتُمْ أَن تَنفُذُوا۟ مِنْ أَقْطَارِ ٱلسَّمَـٰوَاتِ وَٱلْأَرْضِ فَٱنفُذُوا۟ لَا تَنفُذُونَ إِلَّا بِسُلْطَـٰنٍ' },
  { surah: 56, verse: 1, text: 'إِذَا وَقَعَتِ ٱلْوَاقِعَةُ' },
  { surah: 56, verse: 2, text: 'لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ' },
  { surah: 56, verse: 3, text: 'خَافِضَةٌ رَّافِعَةٌ' },
  { surah: 56, verse: 4, text: 'إِذَا رُجَّتِ ٱلْأَرْضُ رَجًّا' },
  { surah: 56, verse: 5, text: 'وَبُسَّتِ ٱلْجِبَالُ بَسًّا' },
  { surah: 56, verse: 6, text: 'فَكَانَتْ هَبَآءً مُّنۢبَثًّا' },
  { surah: 59, verse: 21, text: 'لَوْ أَنزَلْنَا هَـٰذَا ٱلْقُرْءَانَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُۥ خَـٰشِعًا مُّتَصَدِّعًا مِّنْ خَشْيَةِ ٱللَّهِ' },
  { surah: 59, verse: 22, text: 'هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ عَـٰلِمُ ٱلْغَيْبِ وَٱلشَّهَـٰدَةِ هُوَ ٱلرَّحْمَـٰنُ ٱلرَّحِيمُ' },
  { surah: 59, verse: 23, text: 'هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَـٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ سُبْحَـٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ' },
  { surah: 59, verse: 24, text: 'هُوَ ٱللَّهُ ٱلْخَـٰلِقُ ٱلْبَارِئُ ٱلْمُصَوِّرُ لَهُ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ' },
  { surah: 61, verse: 1, text: 'سَبَّحَ لِلَّهِ مَا فِى ٱلسَّمَـٰوَاتِ وَمَا فِى ٱلْأَرْضِ وَهُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ' },
  { surah: 61, verse: 4, text: 'إِنَّ ٱللَّهَ يُحِبُّ ٱلَّذِينَ يُقَـٰتِلُونَ فِى سَبِيلِهِۦ صَفًّا كَأَنَّهُم بُنْيَـٰنٌ مَّرْصُوصٌ' },
  { surah: 67, verse: 1, text: 'تَبَـٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ' },
  { surah: 67, verse: 2, text: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ' },
  { surah: 67, verse: 3, text: 'ٱلَّذِى خَلَقَ سَبْعَ سَمَـٰوَاتٍ طِبَاقًا مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَـٰنِ مِن تَفَـٰوُتٍ' },
  { surah: 67, verse: 4, text: 'ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ' },
  { surah: 68, verse: 1, text: 'نٓ وَٱلْقَلَمِ وَمَا يَسْطُرُونَ' },
  { surah: 68, verse: 2, text: 'مَآ أَنتَ بِنِعْمَةِ رَبِّكَ بِمَجْنُونٍ' },
  { surah: 68, verse: 3, text: 'وَإِنَّ لَكَ لَأَجْرًا غَيْرَ مَمْنُونٍ' },
  { surah: 68, verse: 4, text: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ' },
  { surah: 69, verse: 1, text: 'ٱلْحَآقَّةُ' },
  { surah: 69, verse: 2, text: 'مَا ٱلْحَآقَّةُ' },
  { surah: 69, verse: 3, text: 'وَمَآ أَدْرَىٰكَ مَا ٱلْحَآقَّةُ' },
  { surah: 70, verse: 1, text: 'سَأَلَ سَآئِلٌۢ بِعَذَابٍ وَاقِعٍ' },
  { surah: 70, verse: 2, text: 'لِّلْكَـٰفِرِينَ لَيْسَ لَهُۥ دَافِعٌ' },
  { surah: 70, verse: 3, text: 'مِّنَ ٱللَّهِ ذِى ٱلْمَعَارِجِ' },
  { surah: 70, verse: 4, text: 'تَعْرُجُ ٱلْمَلَـٰٓئِكَةُ وَٱلرُّوحُ إِلَيْهِ فِى يَوْمٍ كَانَ مِقْدَارُهُۥ خَمْسِينَ أَلْفَ سَنَةٍ' },
  { surah: 71, verse: 1, text: 'إِنَّآ أَرْسَلْنَا نُوحًا إِلَىٰ قَوْمِهِۦٓ أَنْ أَنذِرْ قَوْمَكَ مِن قَبْلِ أَن يَأْتِيَهُمْ عَذَابٌ أَلِيمٌ' },
  { surah: 71, verse: 2, text: 'قَالَ يَـٰقَوْمِ إِنِّى لَكُمْ نَذِيرٌ مُّبِينٌ' },
  { surah: 72, verse: 1, text: 'قُلْ أُوحِىَ إِلَىَّ أَنَّهُ ٱسْتَمَعَ نَفَرٌ مِّنَ ٱلْجِنِّ فَقَالُوٓا۟ إِنَّا سَمِعْنَا قُرْءَانًا عَجَبًا' },
  { surah: 73, verse: 1, text: 'يَـٰٓأَيُّهَا ٱلْمُزَّمِّلُ' },
  { surah: 73, verse: 2, text: 'قُمِ ٱلَّيْلَ إِلَّا قَلِيلًا' },
  { surah: 73, verse: 3, text: 'نِّصْفَهُۥٓ أَوِ ٱنقُصْ مِنْهُ قَلِيلًا' },
  { surah: 73, verse: 4, text: 'أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا' },
  { surah: 74, verse: 1, text: 'يَـٰٓأَيُّهَا ٱلْمُدَّثِّرُ' },
  { surah: 74, verse: 2, text: 'قُمْ فَأَنذِرْ' },
  { surah: 74, verse: 3, text: 'وَرَبَّكَ فَكَبِّرْ' },
  { surah: 74, verse: 4, text: 'وَثِيَابَكَ فَطَهِّرْ' },
  { surah: 75, verse: 1, text: 'لَآ أُقْسِمُ بِيَوْمِ ٱلْقِيَـٰمَةِ' },
  { surah: 75, verse: 2, text: 'وَلَآ أُقْسِمُ بِٱلنَّفْسِ ٱللَّوَّامَةِ' },
  { surah: 75, verse: 3, text: 'أَيَحْسَبُ ٱلْإِنسَـٰنُ أَلَّن نَّجْمَعَ عِظَامَهُۥ' },
  { surah: 76, verse: 1, text: 'هَلْ أَتَىٰ عَلَى ٱلْإِنسَـٰنِ حِينٌ مِّنَ ٱلدَّهْرِ لَمْ يَكُن شَيْـًٔا مَّذْكُورًا' },
  { surah: 76, verse: 2, text: 'إِنَّا خَلَقْنَا ٱلْإِنسَـٰنَ مِن نُّطْفَةٍ أَمْشَاجٍ نَّبْتَلِيهِ فَجَعَلْنَـٰهُ سَمِيعَۢا بَصِيرًا' },
  { surah: 77, verse: 1, text: 'وَٱلْمُرْسَلَـٰتِ عُرْفًا' },
  { surah: 77, verse: 2, text: 'فَٱلْعَـٰصِفَـٰتِ عَصْفًا' },
  { surah: 77, verse: 3, text: 'وَٱلنَّـٰشِرَٰتِ نَشْرًا' },
  { surah: 77, verse: 4, text: 'فَٱلْفَـٰرِقَـٰتِ فَرْقًا' },
  { surah: 77, verse: 5, text: 'فَٱلْمُلْقِيَـٰتِ ذِكْرًا' },
  { surah: 77, verse: 6, text: 'عُذْرًا أَوْ نُذْرًا' },
  { surah: 77, verse: 7, text: 'إِنَّمَا تُوعَدُونَ لَوَٰقِعٌ' },

  // ═══ JUZ 1-19 (Surahs 1-27) → HARD ═══
  { surah: 1, verse: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { surah: 1, verse: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ' },
  { surah: 1, verse: 3, text: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { surah: 1, verse: 4, text: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ' },
  { surah: 1, verse: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
  { surah: 1, verse: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
  { surah: 1, verse: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' },
  { surah: 2, verse: 163, text: 'وَإِلَـٰهُكُمْ إِلَـٰهٌ وَٰحِدٌ لَّآ إِلَـٰهَ إِلَّا هُوَ ٱلرَّحْمَـٰنُ ٱلرَّحِيمُ' },
  { surah: 2, verse: 255, text: 'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ' },
  { surah: 2, verse: 256, text: 'لَآ إِكْرَاهَ فِى ٱلدِّينِ قَد تَّبَيَّنَ ٱلرُّشْدُ مِنَ ٱلْغَىِّ' },
  { surah: 2, verse: 285, text: 'ءَامَنَ ٱلرَّسُولُ بِمَآ أُنزِلَ إِلَيْهِ مِن رَّبِّهِۦ وَٱلْمُؤْمِنُونَ' },
  { surah: 2, verse: 286, text: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ' },
  { surah: 3, verse: 2, text: 'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ' },
  { surah: 3, verse: 3, text: 'نَزَّلَ عَلَيْكَ ٱلْكِتَـٰبَ بِٱلْحَقِّ مُصَدِّقًا لِّمَا بَيْنَ يَدَيْهِ' },
  { surah: 3, verse: 18, text: 'شَهِدَ ٱللَّهُ أَنَّهُۥ لَآ إِلَـٰهَ إِلَّا هُوَ وَٱلْمَلَـٰٓئِكَةُ وَأُو۟لُوا۟ ٱلْعِلْمِ قَآئِمًۢا بِٱلْقِسْطِ' },
  { surah: 3, verse: 185, text: 'كُلُّ نَفْسٍ ذَآئِقَةُ ٱلْمَوْتِ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ ٱلْقِيَـٰمَةِ' },
  { surah: 5, verse: 1, text: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ أَوْفُوا۟ بِٱلْعُقُودِ' },
  { surah: 5, verse: 8, text: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ كُونُوا۟ قَوَّٰمِينَ لِلَّهِ شُهَدَآءَ بِٱلْقِسْطِ' },
  { surah: 5, verse: 32, text: 'مِنْ أَجْلِ ذَٰلِكَ كَتَبْنَا عَلَىٰ بَنِىٓ إِسْرَٰٓءِيلَ أَنَّهُۥ مَن قَتَلَ نَفْسًۢا بِغَيْرِ نَفْسٍ أَوْ فَسَادٍ فِى ٱلْأَرْضِ فَكَأَنَّمَا قَتَلَ ٱلنَّاسَ جَمِيعًا' },
  { surah: 9, verse: 18, text: 'إِنَّمَا يَعْمُرُ مَسَـٰجِدَ ٱللَّهِ مَنْ ءَامَنَ بِٱللَّهِ وَٱلْيَوْمِ ٱلْـَٔاخِرِ' },
  { surah: 12, verse: 1, text: 'الٓر تِلْكَ ءَايَـٰتُ ٱلْكِتَـٰبِ ٱلْمُبِينِ' },
  { surah: 12, verse: 4, text: 'إِذْ قَالَ يُوسُفُ لِأَبِيهِ يَـٰٓأَبَتِ إِنِّى رَأَيْتُ أَحَدَ عَشَرَ كَوْكَبًا وَٱلشَّمْسَ وَٱلْقَمَرَ رَأَيْتُهُمْ لِى سَـٰجِدِينَ' },
  { surah: 12, verse: 87, text: 'وَلَا تَا۟يْـَٔسُوا۟ مِن رَّوْحِ ٱللَّهِ إِنَّهُۥ لَا يَا۟يْـَٔسُ مِن رَّوْحِ ٱللَّهِ إِلَّا ٱلْقَوْمُ ٱلْكَـٰفِرُونَ' },
  { surah: 13, verse: 1, text: 'الٓمٓر تِلْكَ ءَايَـٰتُ ٱلْكِتَـٰبِ وَٱلَّذِىٓ أُنزِلَ إِلَيْكَ مِن رَّبِّكَ ٱلْحَقُّ' },
  { surah: 13, verse: 11, text: 'إِنَّ ٱللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا۟ مَا بِأَنفُسِهِمْ' },
  { surah: 17, verse: 1, text: 'سُبْحَـٰنَ ٱلَّذِىٓ أَسْرَىٰ بِعَبْدِهِۦ لَيْلًا مِّنَ ٱلْمَسْجِدِ ٱلْحَرَامِ إِلَى ٱلْمَسْجِدِ ٱلْأَقْصَى' },
  { surah: 17, verse: 23, text: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوٓا۟ إِلَّآ إِيَّاهُ وَبِٱلْوَٰلِدَيْنِ إِحْسَـٰنًا' },
  { surah: 17, verse: 36, text: 'وَلَا تَقْفُ مَا لَيْسَ لَكَ بِهِۦ عِلْمٌ إِنَّ ٱلسَّمْعَ وَٱلْبَصَرَ وَٱلْفُؤَادَ كُلُّ أُو۟لَـٰٓئِكَ كَانَ عَنْهُ مَسْـُٔولًا' },
  { surah: 17, verse: 70, text: 'وَلَقَدْ كَرَّمْنَا بَنِىٓ ءَادَمَ وَحَمَلْنَـٰهُمْ فِى ٱلْبَرِّ وَٱلْبَحْرِ' },
  { surah: 17, verse: 110, text: 'قُلِ ٱدْعُوا۟ ٱللَّهَ أَوِ ٱدْعُوا۟ ٱلرَّحْمَـٰنَ أَيًّا مَّا تَدْعُوا۟ فَلَهُ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ' },
  { surah: 18, verse: 1, text: 'ٱلْحَمْدُ لِلَّهِ ٱلَّذِىٓ أَنزَلَ عَلَىٰ عَبْدِهِ ٱلْكِتَـٰبَ وَلَمْ يَجْعَل لَّهُۥ عِوَجًا' },
  { surah: 18, verse: 7, text: 'إِنَّا جَعَلْنَا مَا عَلَى ٱلْأَرْضِ زِينَةً لَّهَا لِنَبْلُوَهُمْ أَيُّهُمْ أَحْسَنُ عَمَلًا' },
  { surah: 18, verse: 10, text: 'إِذْ أَوَى ٱلْفِتْيَةُ إِلَى ٱلْكَهْفِ فَقَالُوا۟ رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا' },
  { surah: 18, verse: 29, text: 'وَقُلِ ٱلْحَقُّ مِن رَّبِّكُمْ فَمَن شَآءَ فَلْيُؤْمِن وَمَن شَآءَ فَلْيَكْفُرْ' },
  { surah: 18, verse: 110, text: 'قُلْ إِنَّمَآ أَنَا۠ بَشَرٌ مِّثْلُكُمْ يُوحَىٰٓ إِلَىَّ أَنَّمَآ إِلَـٰهُكُمْ إِلَـٰهٌ وَٰحِدٌ' },
  { surah: 20, verse: 2, text: 'مَآ أَنزَلْنَا عَلَيْكَ ٱلْقُرْءَانَ لِتَشْقَىٰٓ' },
  { surah: 20, verse: 3, text: 'إِلَّا تَذْكِرَةً لِّمَن يَخْشَىٰ' },
  { surah: 20, verse: 14, text: 'إِنَّنِىٓ أَنَا ٱللَّهُ لَآ إِلَـٰهَ إِلَّآ أَنَا۠ فَٱعْبُدْنِى وَأَقِمِ ٱلصَّلَوٰةَ لِذِكْرِىٓ' },
  { surah: 20, verse: 25, text: 'قَالَ رَبِّ ٱشْرَحْ لِى صَدْرِى' },
  { surah: 20, verse: 114, text: 'فَتَعَـٰلَى ٱللَّهُ ٱلْمَلِكُ ٱلْحَقُّ وَلَا تَعْجَلْ بِٱلْقُرْءَانِ مِن قَبْلِ أَن يُقْضَىٰٓ إِلَيْكَ وَحْيُهُۥ' },
  { surah: 20, verse: 115, text: 'وَلَقَدْ عَهِدْنَآ إِلَىٰٓ ءَادَمَ مِن قَبْلُ فَنَسِىَ وَلَمْ نَجِدْ لَهُۥ عَزْمًا' },
  { surah: 21, verse: 1, text: 'ٱقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ وَهُمْ فِى غَفْلَةٍ مُّعْرِضُونَ' },
  { surah: 21, verse: 22, text: 'لَوْ كَانَ فِيهِمَآ ءَالِهَةٌ إِلَّا ٱللَّهُ لَفَسَدَتَا فَسُبْحَـٰنَ ٱللَّهِ رَبِّ ٱلْعَرْشِ عَمَّا يَصِفُونَ' },
  { surah: 21, verse: 30, text: 'أَوَلَمْ يَرَ ٱلَّذِينَ كَفَرُوٓا۟ أَنَّ ٱلسَّمَـٰوَاتِ وَٱلْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَـٰهُمَا وَجَعَلْنَا مِنَ ٱلْمَآءِ كُلَّ شَىْءٍ حَىٍّ' },
  { surah: 21, verse: 35, text: 'كُلُّ نَفْسٍ ذَآئِقَةُ ٱلْمَوْتِ وَنَبْلُوكُم بِٱلشَّرِّ وَٱلْخَيْرِ فِتْنَةً وَإِلَيْنَا تُرْجَعُونَ' },
  { surah: 22, verse: 1, text: 'يَـٰٓأَيُّهَا ٱلنَّاسُ ٱتَّقُوا۟ رَبَّكُمْ إِنَّ زَلْزَلَةَ ٱلسَّاعَةِ شَىْءٌ عَظِيمٌ' },
  { surah: 23, verse: 1, text: 'قَدْ أَفْلَحَ ٱلْمُؤْمِنُونَ' },
  { surah: 23, verse: 2, text: 'ٱلَّذِينَ هُمْ فِى صَلَاتِهِمْ خَـٰشِعُونَ' },
  { surah: 23, verse: 3, text: 'وَٱلَّذِينَ هُمْ عَنِ ٱللَّغْوِ مُعْرِضُونَ' },
  { surah: 23, verse: 4, text: 'وَٱلَّذِينَ هُمْ لِلزَّكَوٰةِ فَـٰعِلُونَ' },
  { surah: 23, verse: 5, text: 'وَٱلَّذِينَ هُمْ لِفُرُوجِهِمْ حَـٰفِظُونَ' },
  { surah: 24, verse: 35, text: 'ٱللَّهُ نُورُ ٱلسَّمَـٰوَاتِ وَٱلْأَرْضِ مَثَلُ نُورِهِۦ كَمِشْكَوٰةٍ فِيهَا مِصْبَاحٌ' },
  { surah: 24, verse: 40, text: 'أَوْ كَظُلُمَـٰتٍ فِى بَحْرٍ لُّجِّىٍّ يَغْشَىٰهُ مَوْجٌ مِّن فَوْقِهِۦ مَوْجٌ مِّن فَوْقِهِۦ سَحَابٌ ظُلُمَـٰتٌۢ بَعْضُهَا فَوْقَ بَعْضٍ' },
  { surah: 25, verse: 1, text: 'تَبَارَكَ ٱلَّذِى نَزَّلَ ٱلْفُرْقَانَ عَلَىٰ عَبْدِهِۦ لِيَكُونَ لِلْعَـٰلَمِينَ نَذِيرًا' },
  { surah: 25, verse: 63, text: 'وَعِبَادُ ٱلرَّحْمَـٰنِ ٱلَّذِينَ يَمْشُونَ عَلَى ٱلْأَرْضِ هَوْنًا وَإِذَا خَاطَبَهُمُ ٱلْجَـٰهِلُونَ قَالُوا۟ سَلَـٰمًا' },
  { surah: 26, verse: 2, text: 'تِلْكَ ءَايَـٰتُ ٱلْكِتَـٰبِ ٱلْمُبِينِ' },
  { surah: 26, verse: 214, text: 'وَأَنذِرْ عَشِيرَتَكَ ٱلْأَقْرَبِينَ' },
  { surah: 27, verse: 1, text: 'طسٓ تِلْكَ ءَايَـٰتُ ٱلْقُرْءَانِ وَكِتَابٍ مُّبِينٍ' },
  { surah: 27, verse: 30, text: 'إِنَّهُۥ مِن سُلَيْمَـٰنَ وَإِنَّهُۥ بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ' },
  { surah: 27, verse: 62, text: 'أَمَّن يُجِيبُ ٱلْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ ٱلسُّوٓءَ وَيَجْعَلُكُمْ خُلَفَآءَ ٱلْأَرْضِ' },
];

const CLASSIC_QUESTIONS: { question: string; questionAr: string; options: string[]; answerIndex: number }[] = [
  { question: 'Which is the longest surah in the Quran?', questionAr: 'ما أطول سورة في القرآن؟', options: ['Al-Baqarah', "Ali 'Imran", 'An-Nisa', 'Al-Araf'], answerIndex: 0 },
  { question: 'Which surah does not begin with Bismillah?', questionAr: 'ما السورة التي لا تبدأ بالبسملة؟', options: ['Al-Fatihah', 'At-Tawbah', 'Al-Ikhlas', 'An-Nas'], answerIndex: 1 },
  { question: 'Which surah was revealed first?', questionAr: 'ما أول سورة نزلت؟', options: ['Al-Fatihah', 'Al-Alaq', 'Al-Qalam', 'Al-Muzzammil'], answerIndex: 1 },
  { question: 'What is the shortest surah in the Quran?', questionAr: 'ما أقصر سورة في القرآن؟', options: ['Al-Ikhlas', 'Al-Kawthar', 'Al-Asr', 'An-Nasr'], answerIndex: 1 },
  { question: 'Which surah is named "The Opening"?', questionAr: 'ما السورة التي تسمى "الفاتحة"؟', options: ['Al-Fatihah', 'Al-Falaq', 'An-Nas', 'Al-Ikhlas'], answerIndex: 0 },
  { question: 'Which surah is called "The Sincere Religion"?', questionAr: 'ما السورة التي تسمى "الإخلاص"؟', options: ['Al-Fatihah', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'], answerIndex: 1 },
  { question: 'In which surah is Ayat Al-Kursi found?', questionAr: 'في أي سورة توجد آية الكرسي؟', options: ["Ali 'Imran", 'Al-Baqarah', 'An-Nisa', 'Al-Maidah'], answerIndex: 1 },
  { question: 'Which surah is called "The Daybreak"?', questionAr: 'ما السورة التي تسمى "الفلق"؟', options: ['Al-Falaq', 'An-Nas', 'Al-Ikhlas', 'Al-Kawthar'], answerIndex: 0 },
  { question: 'Which surah is called "Mankind"?', questionAr: 'ما السورة التي تسمى "الناس"؟', options: ['Al-Falaq', 'An-Nas', 'Al-Ikhlas', 'Al-Asr'], answerIndex: 1 },
  { question: 'Which surah is known as "The Victory"?', questionAr: 'ما السورة التي تسمى "النصر"؟', options: ['Al-Fath', 'An-Nasr', 'Al-Fatihah', 'Al-Qadr'], answerIndex: 1 },
  { question: 'Which surah is named after the time of day?', questionAr: 'ما السورة التي سميت باسم وقت من اليوم؟', options: ['Al-Asr', 'Al-Layl', 'Ad-Duha', 'Al-Fajr'], answerIndex: 0 },
  { question: 'Which surah is in Juz 30?', questionAr: 'ما السورة التي في الجزء 30؟', options: ['An-Naba', "Ali 'Imran", 'Al-Baqarah', 'Ya-Sin'], answerIndex: 0 },
  { question: 'What is the first ayah of Surah Al-Alaq?', questionAr: 'ما أول آية من سورة العلق؟', options: ['اقرأ باسم ربك', 'الحمد لله', 'قل هو الله أحد', 'إنا أنزلناه'], answerIndex: 0 },
  { question: 'Which surah is called the "Heart of the Quran"?', questionAr: 'ما السورة التي تسمى "قلب القرآن"؟', options: ['Ya-Sin', 'Al-Fatihah', 'Al-Ikhlas', 'Ar-Rahman'], answerIndex: 0 },
  { question: 'Which surah is called "The Mother of the Book"?', questionAr: 'ما السورة التي تسمى "أم الكتاب"؟', options: ['Al-Baqarah', 'Al-Fatihah', 'Ya-Sin', 'Al-Mulk'], answerIndex: 1 },
  { question: 'Which surah is named after a woman?', questionAr: 'ما السورة التي سميت باسم امرأة؟', options: ["Ali 'Imran", 'Maryam', 'Al-Baqarah', 'An-Nisa'], answerIndex: 1 },
  { question: 'Which surah has the most verses?', questionAr: 'ما السورة التي لها أكبر عدد من الآيات؟', options: ["Ali 'Imran", 'Al-Baqarah', 'An-Nisa', "Al-Ma'idah"], answerIndex: 1 },
  { question: 'Which surah is named after an insect?', questionAr: 'ما السورة التي سميت باسم حشرة؟', options: ['An-Nahl', 'Al-Ankabut', 'An-Naml', 'Al-Fil'], answerIndex: 2 },
  { question: 'Which surah is called "The Beneficent"?', questionAr: 'ما السورة التي تسمى "الرحمن"؟', options: ['Ar-Rahman', 'Al-Fatihah', 'Al-Ikhlas', 'Ta-Ha'], answerIndex: 0 },
  { question: 'What does "Bismillah" mean?', questionAr: 'ماذا تعني البسملة؟', options: ['In the name of Allah', 'Allah is Great', 'Praise be to Allah', 'Glory be to Allah'], answerIndex: 0 },
  { question: 'What is the first revelation received by Prophet Muhammad?', questionAr: 'ما أول ما نزل على النبي محمد؟', options: ['Surah Al-Fatihah', 'Surah Al-Alaq 1-5', 'Surah Al-Qalam', 'Surah Al-Muzzammil'], answerIndex: 1 },
  { question: 'Which surah contains the most commands from Allah?', questionAr: 'ما السورة التي تحتوي على أكثر الأوامر من الله؟', options: ['Al-Baqarah', 'An-Nisa', "Al-Ma'idah", 'Al-Araf'], answerIndex: 0 },
  { question: 'What is the meaning of "Al-Fatihah"?', questionAr: 'ما معنى "الفاتحة"؟', options: ['The Opening', 'The Victory', 'The Chapter', 'The Light'], answerIndex: 0 },
  { question: 'Which surah is also known as "Bani Israel"?', questionAr: 'ما السورة التي تسمى أيضاً "بني إسرائيل"؟', options: ['Al-Isra', "Ali 'Imran", 'Al-Baqarah', 'Al-Araf'], answerIndex: 0 },
  { question: 'Which surah is named after a city?', questionAr: 'ما السورة التي سميت باسم مدينة؟', options: ['Al-Madina', "At-Ta'if", 'Makkah', 'Al-Balad'], answerIndex: 2 },
  { question: 'Which surah talks about the elephant army?', questionAr: 'ما السورة التي تتحدث عن جيش الفيل؟', options: ['Al-Fil', 'Al-Ankabut', 'An-Naml', 'Al-Adiyat'], answerIndex: 0 },
  { question: 'Which surah is named after "The Cave"?', questionAr: 'ما السورة المسماة "الكهف"؟', options: ['Al-Kahf', 'Al-Ghar', 'Al-Maghara', 'Al-Kahf'], answerIndex: 3 },
  { question: 'Which surah begins with "Alif Lam Meem"?', questionAr: 'ما السورة التي تبدأ بـ "الم"؟', options: ["Ali 'Imran", 'Al-Baqarah', 'Al-Ankabut', 'Al-Anfal'], answerIndex: 1 },
  { question: 'Which surah is named after "The Star"?', questionAr: 'ما السورة المسماة "النجم"؟', options: ['An-Najm', 'Al-Qamar', 'Ash-Shams', 'Al-Buruj'], answerIndex: 0 },
  { question: 'Which surah is called "The Peak of Eloquence" (سنام القرآن)?', questionAr: 'ما السورة التي تسمى "سنام القرآن"؟', options: ['Ya-Sin', 'Al-Baqarah', 'Al-Fatihah', 'Al-Ikhlas'], answerIndex: 1 },
  { question: 'Which surah is called "The Catastrophe"?', questionAr: 'ما السورة التي تسمى "الدامغة"؟', options: ['Al-Qariah', 'Az-Zalzalah', 'At-Takwir', 'Al-Infitar'], answerIndex: 0 },
  { question: 'Which surah ends with two prostrations?', questionAr: 'ما السورة التي تنتهي بسجدتين؟', options: ['Al-Araf', 'Ar-Rahman', 'Al-Alaq', 'An-Najm'], answerIndex: 3 },
  { question: 'Which surah is named after "The Spoils of War"?', questionAr: 'ما السورة المسماة "الأنفال"؟', options: ['Al-Anfal', 'Al-Ghanima', "Al-Fay'", 'Al-Maghnam'], answerIndex: 0 },
  { question: 'Which surah has the most prophets mentioned?', questionAr: 'ما السورة التي ذكر فيها أكثر عدد من الأنبياء؟', options: ['Al-Anbiya', 'Al-Araf', 'Maryam', 'Hud'], answerIndex: 0 },
  { question: 'Which surah is named after a battle?', questionAr: 'ما السورة التي سميت باسم غزوة؟', options: ['Al-Ahzab', 'Al-Fath', 'Al-Hunain', 'Al-Anfal'], answerIndex: 0 },
  { question: 'Which surah contains the verse of the sword (آية السيف)?', questionAr: 'في أي سورة توجد آية السيف؟', options: ['At-Tawbah', 'Al-Baqarah', 'Al-Fath', 'Al-Anfal'], answerIndex: 0 },
  { question: 'Which surah has every verse ending with the same letter?', questionAr: 'ما السورة التي تنتهي كل آياتها بحرف واحد؟', options: ['Al-Fatihah', 'Al-Ikhlas', 'Al-Qamar', 'Ar-Rahman'], answerIndex: 2 },
  { question: 'What is the only surah named after a prayer?', questionAr: 'ما السورة الوحيدة التي سميت باسم صلاة؟', options: ['Al-Jumuah', 'Al-Fajr', 'Al-Layl', 'Ad-Duha'], answerIndex: 0 },
  { question: 'Which surah is called "The Criterion"?', questionAr: 'ما السورة التي تسمى "الفرقان"؟', options: ['Al-Furqan', 'Al-Bayyinah', 'Al-Mizan', 'Al-Farq'], answerIndex: 0 },
  { question: 'Which surah was revealed in two different places (Mecca and Medina)?', questionAr: 'ما السورة التي نزلت في مكانين؟', options: ['Al-Fatihah', 'Al-Baqarah', "Ali 'Imran", 'An-Nisa'], answerIndex: 0 },
  { question: 'Which surah contains the verse "And We have made the Quran easy to remember"?', questionAr: 'في أي سورة "ولقد يسرنا القرآن للذكر"؟', options: ['Al-Qamar', 'Ar-Rahman', 'Al-Insan', 'Al-Muzzammil'], answerIndex: 0 },
  { question: 'Which surah is named after "The Pen"?', questionAr: 'ما السورة المسماة "القلم"؟', options: ['Al-Qalam', 'Al-Kalam', 'Al-Ilm', 'Al-Kitab'], answerIndex: 0 },
  { question: 'Which surah starts with a question?', questionAr: 'ما السورة التي تبدأ بسؤال؟', options: ['Al-Insan', 'Al-Ghashiyah', 'Al-Balad', 'Al-Insan'], answerIndex: 0 },
  { question: 'Which surah contains the story of Dhul-Qarnayn?', questionAr: 'في أي سورة قصة ذي القرنين؟', options: ['Al-Kahf', 'Al-Anbiya', 'Al-Isra', 'Al-Araf'], answerIndex: 0 },
  { question: 'What is the 19th juz called?', questionAr: 'ماذا يسمى الجزء التاسع عشر؟', options: ['Wa Qala Alladheena', 'Tabaraka', 'Qad Aflaha', 'Subhan'], answerIndex: 0 },
  { question: 'Which surah in Juz 1-10 is named after a color?', questionAr: 'ما السورة في الأجزاء 1-10 التي سميت بلون؟', options: ['Al-Baqarah', 'Al-Araf', 'Al-Hijr', 'Al-Fatihah'], answerIndex: 0 },
];

function splitIntoWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

const ARABIC_NUMERAL_RE = /^[\u0660-\u0669]+$/;

function hasNumeralWord(words: string[]): boolean {
  return words.some(w => ARABIC_NUMERAL_RE.test(w));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateDistractors(correctWord: string, allWords: string[], count: number = 3): string[] {
  const distractors: string[] = [];
  const pool = allWords.filter(w =>
    !ARABIC_NUMERAL_RE.test(w) &&
    normalizeForMatch(w) !== normalizeForMatch(correctWord) &&
    w !== correctWord
  );
  const shuffled = [...new Set(pool)].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    if (distractors.length >= count) break;
    if (!distractors.includes(word) && normalizeForMatch(word) !== normalizeForMatch(correctWord)) {
      distractors.push(word);
    }
  }

  while (distractors.length < count) {
    const fillers = ['ٱللَّهُ', 'رَبِّ', 'ٱلرَّحْمَـٰنِ', 'ٱلرَّحِيمِ', 'ٱلْحَمْدُ', 'مَلِكِ', 'قُلْ', 'هُوَ', 'مِن', 'عَلَىٰ'];
    const f = fillers.filter(w => !distractors.includes(w) && normalizeForMatch(w) !== normalizeForMatch(correctWord));
    if (f.length === 0) break;
    distractors.push(f[0]);
  }

  return distractors;
}

function getUsedKeys(): string[] {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey('usedQuizKeys')) || '[]');
  } catch { return []; }
}

function addUsedKeys(keys: string[]) {
  const existing = getUsedKeys();
  const merged = [...new Set([...existing, ...keys])];
  localStorage.setItem(getStorageKey('usedQuizKeys'), JSON.stringify(merged));
}

function generateMissingWordQuestion(excludeKeys?: string[]): QuizQuestion {
  const used = excludeKeys || [];
  const available = AYAH_POOL.filter(a =>
    Math.max(a.text.split(/\s+/).filter(Boolean).length, 2) >= 2 &&
    !hasNumeralWord(splitIntoWords(a.text)) &&
    !used.includes(`${a.surah}:${a.verse}`)
  );
  const fallback = AYAH_POOL.filter(a =>
    Math.max(a.text.split(/\s+/).filter(Boolean).length, 2) >= 2 &&
    !hasNumeralWord(splitIntoWords(a.text))
  );
  const pool = available.length > 0 ? available : fallback;
  const ayah = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : AYAH_POOL[0];
  const words = splitIntoWords(ayah.text);
  const missingIndex = Math.floor(Math.random() * words.length);
  const missingWord = words[missingIndex];

  const allWordsInPool = AYAH_POOL.flatMap(a => splitIntoWords(a.text));
  const distractors = generateDistractors(missingWord, allWordsInPool, 3);

  const options = shuffle([missingWord, ...distractors]);
  const answerIndex = options.indexOf(missingWord);

  return {
    type: 'missing-word',
    surah: ayah.surah,
    verse: ayah.verse,
    verseKey: `${ayah.surah}:${ayah.verse}`,
    fullAyah: ayah.text,
    missingWord,
    missingIndex,
    question: `missing-word:${ayah.surah}:${ayah.verse}:${missingIndex}`,
    options,
    answerIndex,
  };
}

function generateSurahIdQuestion(excludeKeys?: string[]): QuizQuestion {
  const used = excludeKeys || [];
  const available = AYAH_POOL.filter(a =>
    !used.includes(`${a.surah}:${a.verse}`)
  );
  const pool = available.length > 0 ? available : AYAH_POOL;
  const ayah = pool[Math.floor(Math.random() * pool.length)];

  const correctSurahId = ayah.surah;
  const correctSurah = SURAHS.find(s => s.id === correctSurahId);
  if (!correctSurah) return generateSurahIdQuestion(excludeKeys);

  const otherSurahs = SURAHS.filter(s => s.id !== correctSurahId).sort(() => Math.random() - 0.5);
  const distractors = otherSurahs.slice(0, 3).map(s => s.name);

  const options = shuffle([correctSurah.name, ...distractors]);
  const answerIndex = options.indexOf(correctSurah.name);

  return {
    type: 'surah-id',
    surah: correctSurahId,
    verse: ayah.verse,
    verseKey: `${ayah.surah}:${ayah.verse}`,
    fullAyah: ayah.text,
    question: `surah-id:${ayah.surah}:${ayah.verse}`,
    options,
    answerIndex,
  };
}

function generateSahabyQuestion(): QuizQuestion {
  const pool = [...SAHABA_QUESTIONS];
  const q = pool[Math.floor(Math.random() * pool.length)];

  const allAnswers = pool.map(s => s.answer);
  const distractors = shuffle(allAnswers.filter(a => a !== q.answer)).slice(0, 3);
  const options = shuffle([q.answer, ...distractors]);
  const answerIndex = options.indexOf(q.answer);

  return {
    type: 'sahaby',
    surah: 1,
    verse: 1,
    question: q.question,
    options,
    answerIndex,
  };
}

function generateClassicQuestion(): QuizQuestion {
  const q = CLASSIC_QUESTIONS[Math.floor(Math.random() * CLASSIC_QUESTIONS.length)];
  const options = shuffle(q.options);
  const correctAnswer = q.options[q.answerIndex];
  const answerIndex = options.indexOf(correctAnswer);

  return {
    type: 'classic',
    surah: 1,
    verse: 1,
    question: q.question,
    questionAr: q.questionAr,
    options,
    answerIndex,
  };
}

function generateSurahQuizQuestion(
  surahId: number,
  excludeKeys?: string[],
  versePool?: { surah: number; verse: number; text: string }[],
): QuizQuestion {
  const source = versePool || AYAH_POOL;
  const used = excludeKeys || [];
  const available = source.filter(a =>
    a.surah === surahId &&
    Math.max(a.text.split(/\s+/).filter(Boolean).length, 2) >= 2 &&
    !hasNumeralWord(splitIntoWords(a.text)) &&
    !used.includes(`${a.surah}:${a.verse}`)
  );
  const fallback = source.filter(a =>
    a.surah === surahId &&
    Math.max(a.text.split(/\s+/).filter(Boolean).length, 2) >= 2 &&
    !hasNumeralWord(splitIntoWords(a.text))
  );
  const pool = available.length > 0 ? available : fallback;
  const ayah = pool[Math.floor(Math.random() * pool.length)];
  const words = splitIntoWords(ayah.text);
  const missingIndex = Math.floor(Math.random() * words.length);
  const missingWord = words[missingIndex];
  const allWordsInSurah = source.filter(a => a.surah === surahId).flatMap(a => splitIntoWords(a.text));
  const poolWords = allWordsInSurah.length > 0 ? allWordsInSurah : source.flatMap(a => splitIntoWords(a.text));
  const distractors = generateDistractors(missingWord, poolWords, 3);
  const options = shuffle([missingWord, ...distractors]);
  const answerIndex = options.indexOf(missingWord);

  return {
    type: 'surah',
    surah: ayah.surah,
    verse: ayah.verse,
    verseKey: `${ayah.surah}:${ayah.verse}`,
    fullAyah: ayah.text,
    missingWord,
    missingIndex,
    question: `surah:${ayah.surah}:${ayah.verse}:${missingIndex}`,
    options,
    answerIndex,
  };
}

export function generateQuestions(
  count?: number,
  type?: 'missing-word' | 'surah-id' | 'classic' | 'surah' | 'sahaby',
  surahId?: number,
  versePool?: { surah: number; verse: number; text: string }[],
): QuizQuestion[] {
  const sId = surahId || 0;
  const qCount = count || 10;

  const usedKeys = getUsedKeys();
  const sessionKeys: string[] = [];
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < qCount; i++) {
    let q: QuizQuestion;
    const exclude = [...usedKeys, ...sessionKeys];

    if (type === 'surah' && sId > 0) {
      const source = versePool || AYAH_POOL;
      const avail = source.filter(a =>
        a.surah === sId &&
        Math.max(a.text.split(/\s+/).filter(Boolean).length, 2) >= 2 &&
        !hasNumeralWord(splitIntoWords(a.text))
      );
      if (avail.length === 0) break;
      const actualCount = Math.min(qCount, avail.length);
      if (i >= actualCount) break;
      q = generateSurahQuizQuestion(sId, exclude, versePool);
      sessionKeys.push(`${q.type}:${q.verseKey}:${q.missingIndex}`);
    } else if (type === 'missing-word') {
      q = generateMissingWordQuestion(exclude);
      sessionKeys.push(`${q.type}:${q.verseKey}:${q.missingIndex}`);
    } else if (type === 'surah-id') {
      q = generateSurahIdQuestion(exclude);
      sessionKeys.push(`${q.type}:${q.verseKey}`);
    } else if (type === 'sahaby') {
      q = generateSahabyQuestion();
      sessionKeys.push(`sahaby:${q.question}`);
    } else {
      q = generateClassicQuestion();
      sessionKeys.push(`classic:${q.question}`);
    }
    questions.push(q);
  }

  addUsedKeys(sessionKeys);
  return questions;
}

export function resetUsedKeys() {
  localStorage.removeItem(getStorageKey('usedQuizKeys'));
}

export function getQuizTimer(): number {
  return 20;
}

export const QUIZ_TYPES: { id: 'missing-word' | 'surah-id' | 'classic' | 'surah' | 'sahaby'; labelEn: string; labelAr: string; icon: LucideIcon; descEn: string; descAr: string }[] = [
  { id: 'missing-word', labelEn: 'Missing Word', labelAr: 'الكلمة الناقصة', icon: FileText, descEn: 'Complete the verse by finding the missing word', descAr: 'أكمل الآية باختيار الكلمة الناقصة' },
  { id: 'surah-id', labelEn: 'Identify the Surah', labelAr: 'حدد السورة', icon: BookOpen, descEn: 'Read the verse and guess which surah it belongs to', descAr: 'اقرأ الآية واختر السورة التي تنتمي إليها' },
  { id: 'classic', labelEn: 'Classic Questions', labelAr: 'أسئلة عامة', icon: Lightbulb, descEn: 'Test your Quran knowledge with general questions', descAr: 'اختبر معلوماتك القرآنية بأسئلة عامة' },
  { id: 'surah', labelEn: 'Surah Quiz', labelAr: 'اختبار سورة', icon: ScrollText, descEn: 'Choose a surah and get questions from its verses', descAr: 'اختر سورة وأجب عن أسئلة من آياتها' },
  { id: 'sahaby', labelEn: 'Guess the Sahaby', labelAr: 'خمن الصحابي', icon: Users, descEn: 'Identify the companion based on their description', descAr: 'تعرف على الصحابي من خلال وصفه' },
];
