export const KNOWN_ALIASES: Record<string, string> = {
  'শাহের': 'মোসা: সাহেরা খাতুন',
  'শাহেরা': 'মোসা: সাহেরা খাতুন',
  'সাহেরা': 'মোসা: সাহেরা খাতুন',
  'সাহেরা খাতুন': 'মোসা: সাহেরা খাতুন',
  'মোসা সাহেরা খাতুন': 'মোসা: সাহেরা খাতুন',
  'মোসা: সাহেরা খাতুন (অডিটর)': 'মোসা: সাহেরা খাতুন',
  'শাহেরা আক্তার': 'মোসা: সাহেরা খাতুন',
  'সাহেরা আক্তার': 'মোসা: সাহেরা খাতুন',
  'মো: জামাল উদ্দিন': 'জামাল উদ্দিন',
  'মোঃ জামাল উদ্দিন': 'জামাল উদ্দিন',
  'মো: জামাল উদ্দিন': 'জামাল উদ্দিন',
  'মোঃ জামাল উদ্দিন': 'জামাল উদ্দিন',
  'জামাল উদ্দীন': 'জামাল উদ্দিন',
  'জনাব জামাল উদ্দিন': 'জামাল উদ্দিন',
  'জামাল উদ্দিন (অডিটর)': 'জামাল উদ্দিন',
  'মো: জামাল উদ্দিন (অডিটর)': 'জামাল উদ্দিন',
  'উজ্জ্বল হোসেন': 'মো: উজ্জ্বল হোসেন',
  'নজরুল ইসলাম': 'মো: নজরুল ইসলাম',
  'নুরুল আলম': 'মো: নুরুল আলম',
  'শামমিমা শাহরিন': 'শাম্মীমা শাহরিন',
  'শামিমা শাহরিন': 'শাম্মীমা শাহরিন',
  'শাম্মীমা শাহরিন (অডিটর)': 'শাম্মীমা শাহরিন',
};

export const normalizeName = (name: string | null | undefined): string => {
  if (!name) return '';
  let n = name
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[:ঃ।\.\-]/g, '')
    .normalize('NFC');

  // Strip honorifics / titles / prefixes
  n = n.replace(/^(জনাব|জনাবা|ডাঃ|ডা|ড|ডক্টর|মহোদয়)\s+/, '');
  n = n.replace(/^মো[ঃ:\.]\s*/, '');
  n = n.replace(/^মোঃ\s*/, '');
  n = n.replace(/^মো[ঃ:\.]\s*/, '');
  n = n.replace(/^মোঃ\s*/, '');
  n = n.replace(/^মোসা[ঃ:\.]\s*/, '');
  n = n.replace(/^মোসাঃ\s*/, '');
  n = n.replace(/^মোছা[ঃ:\.]\s*/, '');
  n = n.replace(/^মোছাঃ\s*/, '');

  // Normalize Bengali vowels, sibilants, virama, nukta, nasal marks
  n = n.replace(/ী/g, 'ি')
       .replace(/ূ/g, 'ু')
       .replace(/ষ/g, 'স')
       .replace(/শ/g, 'স')
       .replace(/ণ/g, 'ন')
       .replace(/য়/g, 'য')
       .replace(/্/g, '')
       .replace(/ঁ/g, '')
       .replace(/়/g, '');

  return n.trim();
};

export const isNameMatching = (
  rawTest: string | null | undefined,
  targetOldName: string | null | undefined,
  targetMatchNorm?: string
): boolean => {
  if (!rawTest || !targetOldName) return false;
  const t1 = rawTest.trim();
  const t2 = targetOldName.trim();
  if (t1 === t2) return true;
  if (KNOWN_ALIASES[t1] && (KNOWN_ALIASES[t1] === t2 || KNOWN_ALIASES[t1] === KNOWN_ALIASES[t2])) return true;
  if (KNOWN_ALIASES[t2] && KNOWN_ALIASES[t2] === t1) return true;

  const testNorm = normalizeName(t1);
  const targetNorm = targetMatchNorm || normalizeName(t2);
  if (testNorm && targetNorm && testNorm === targetNorm) return true;

  const cleanRawTest = t1.replace(/^(জনাব|জনাবা|ডাঃ|ডা|ড|ডক্টর|মহোদয়|মোঃ|মো:|মো:|মোঃ|মোসা:|মোসা|মোছা|অডিটর)\s*/g, '').trim();
  const cleanTarget = t2.replace(/^(জনাব|জনাবা|ডাঃ|ডা|ড|ডক্টর|মহোদয়|মোঃ|মো:|মো:|মোঃ|মোসা:|মোসা|মোছা|অডিটর)\s*/g, '').trim();

  if (cleanRawTest && cleanTarget) {
    if (cleanRawTest === cleanTarget) return true;
    const cleanTestNorm = normalizeName(cleanRawTest);
    const cleanTargetNorm = normalizeName(cleanTarget);
    if (cleanTestNorm && cleanTargetNorm && cleanTestNorm === cleanTargetNorm) return true;

    if (cleanTestNorm.length >= 4 && cleanTargetNorm.length >= 4) {
      if (cleanTargetNorm.includes(cleanTestNorm) || cleanTestNorm.includes(cleanTargetNorm)) {
        return true;
      }
    }
  }

  return false;
};

export const resolveCanonicalName = (
  rawName: string | null | undefined,
  activeReceiversList?: any[]
): string => {
  if (!rawName) return 'অনির্ধারিত';
  const trimmed = rawName.trim();
  if (!trimmed) return 'অনির্ধারিত';

  if (KNOWN_ALIASES[trimmed]) {
    return KNOWN_ALIASES[trimmed];
  }

  const norm = normalizeName(trimmed);
  if (!norm) return 'অনির্ধারিত';

  if (KNOWN_ALIASES[norm]) {
    return KNOWN_ALIASES[norm];
  }

  if (activeReceiversList && activeReceiversList.length > 0) {
    for (const r of activeReceiversList) {
      if (!r || !r.name) continue;
      const rName = r.name.trim();
      if (isNameMatching(trimmed, rName, normalizeName(rName))) {
        return rName;
      }
    }
  }

  return trimmed;
};
