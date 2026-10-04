import { Anek_Bangla, Hind_Siliguri } from 'next/font/google';

// Loaded only by the survey and admin layouts, so the public site is unaffected.
const anek = Anek_Bangla({ subsets: ['bengali', 'latin'], weight: ['500', '600'], variable: '--sv-font-head', display: 'swap' });
const hind = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '600'], variable: '--sv-font-body', display: 'swap' });

export const surveyFontVariables = `${anek.variable} ${hind.variable}`;
