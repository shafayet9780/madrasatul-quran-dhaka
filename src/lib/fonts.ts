import { Anek_Bangla, Anek_Latin, Tiro_Bangla } from 'next/font/google';

// The public site's type (tokens: src/styles/tokens.css). Variable weight only: the width axis would triple the
// files (Bengali 152 → 437 KB) for a barely visible difference, so the design sets no font-stretch.
// Anek Bangla loads only its Bengali glyphs: Latin comes from Anek Latin.
const anekLatin = Anek_Latin({ subsets: ['latin'], variable: '--font-anek-latin', display: 'swap' });
const anekBangla = Anek_Bangla({ subsets: ['bengali'], variable: '--font-anek-bangla', display: 'swap' });
// Quotations only, so not preloaded.
const tiroBangla = Tiro_Bangla({ subsets: ['bengali'], weight: '400', variable: '--font-tiro-bangla', display: 'swap', preload: false });

export const siteFontVariables = `${anekLatin.variable} ${anekBangla.variable} ${tiroBangla.variable}`;
