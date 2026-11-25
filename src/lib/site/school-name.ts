// The school's legal name, for code that does not read the translations (metadata, structured data, PDFs, emails,
// admin and survey print-outs, the Studio). The site's pages take it from `site.schoolName` in messages/*.json,
// which must say the same (school-name.test.ts). Running text may use the short name ("কেন মাদরাসাতুল কুরআন?").

export const SCHOOL_NAME = { bengali: 'মাদরাসাতুল কুরআন ঢাকা', english: 'Madrasatul Quran Dhaka' } as const;
/** The Arabic name, as the prospectus cover writes it. */
export const SCHOOL_NAME_ARABIC = 'مدرسة القرآن داکا';
export const SCHOOL_SHORT_NAME = { bengali: 'মাদরাসাতুল কুরআন', english: 'Madrasatul Quran' } as const;
export const SCHOOL_SHORT_NAME_ARABIC = 'مدرسة القرآن';
