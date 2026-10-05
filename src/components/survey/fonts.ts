import { Anek_Bangla, Hind_Siliguri } from 'next/font/google';

// Loaded only by the survey and admin layouts, so the public site is unaffected.
// Only the weights the design uses (headings 600; body 400/600), to keep the first view light on phones.
const anek = Anek_Bangla({ subsets: ['bengali', 'latin'], weight: ['600'], variable: '--sv-font-head', display: 'swap' });
const hind = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '600'], variable: '--sv-font-body', display: 'swap' });

export const surveyFontVariables = `${anek.variable} ${hind.variable}`;
