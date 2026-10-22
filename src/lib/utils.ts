import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The design tokens' own names (src/styles/tokens.css), so `text-18 text-surface` keeps both: a size and a colour.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['11', '12', '13', '14', '15', '16', '17', '18', '19', 'display', 'hero', 'h2', 'h3', 'h4', 'lead', 'figure-xl', 'figure-lg', 'figure-md', 'figure-sm', 'quote-xl', 'quote-lg', 'quote', 'letter'],
      'font-weight': ['strong', 'heading'],
      font: ['quote'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
