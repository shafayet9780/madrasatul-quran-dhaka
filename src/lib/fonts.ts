import { Anek_Latin } from 'next/font/google';

// The public site's type (tokens: src/styles/tokens.css). Variable weight only: the width axis would triple the
// files for a barely visible difference, so the design sets no font-stretch. Latin comes from Anek Latin here; the
// Bengali fonts (Anek Bangla, and Tiro Bangla for quotations) are self-hosted, trimmed (src/styles/fonts.css).
const anekLatin = Anek_Latin({ subsets: ['latin'], variable: '--font-anek-latin', display: 'swap' });

export const siteFontVariables = anekLatin.variable;

/** Anek Bangla's file, preloaded on Bengali pages (src/styles/fonts.css). */
export const ANEK_BANGLA_URL = '/fonts/anek-bangla-v1.woff2';
