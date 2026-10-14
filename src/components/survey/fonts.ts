import { Anek_Bangla, Hind_Siliguri, Inter, Noto_Sans_Bengali } from 'next/font/google';

// Loaded only by the survey and admin layouts, so the public site is unaffected.
// Only the weights the design uses (headings 600; body 400/600), to keep the first view light on phones.
const anek = Anek_Bangla({ subsets: ['bengali', 'latin'], weight: ['600'], variable: '--sv-font-head', display: 'swap' });
const hind = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '600'], variable: '--sv-font-body', display: 'swap' });
// The admin's text fonts (the public site moved to Anek, src/lib/fonts.ts).
const inter = Inter({ subsets: ['latin'], variable: '--font-english', display: 'swap' });
const notoSansBengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bengali', display: 'swap' });

export const surveyFontVariables = `${anek.variable} ${hind.variable}`;
/** The admin: Anek Bangla headings; text in Inter + Noto Sans Bengali. */
export const adminFontVariables = `${anek.variable} ${inter.variable} ${notoSansBengali.variable}`;
