import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Islamic Design System Constants
 */
export const DESIGN_TOKENS = {
  // Color palette
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main Islamic Green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Deep Blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24', // Gold
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },
  
  // Typography
  typography: {
    fontFamilies: {
      bengali: ['var(--font-bengali)', 'Noto Sans Bengali', 'SolaimanLipi', 'sans-serif'],
      english: ['var(--font-english)', 'Inter', 'Roboto', 'sans-serif'],
      arabic: ['var(--font-arabic)', 'Amiri', 'Scheherazade New', 'serif'],
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
    '3xl': '6rem',
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    islamic: '0.5rem',
    mosque: '1rem 1rem 0 0',
  },
  
  // Shadows
  shadows: {
    islamic: '0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -1px rgba(34, 197, 94, 0.06)',
    islamicLg: '0 10px 15px -3px rgba(34, 197, 94, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.05)',
    gold: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
    soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
} as const;

/**
 * Component Variant Classes
 */
export const COMPONENT_VARIANTS = {
  // Button variants
  button: {
    primary: 'btn-islamic',
    secondary: 'btn-islamic-secondary',
    outline: 'btn-islamic-outline',
    gold: 'btn-islamic-gold',
  },
  
  // Card variants
  card: {
    default: 'card-islamic',
    gold: 'card-islamic-gold',
  },
  
  // Input variants
  input: {
    default: 'input-islamic',
    textarea: 'textarea-islamic',
  },
  
  // Typography variants
  heading: {
    primary: 'heading-primary',
    secondary: 'heading-secondary',
    tertiary: 'heading-tertiary',
  },
  
  text: {
    body: 'text-body',
    bodyLarge: 'text-body-large',
  },
} as const;

/**
 * Islamic Pattern Utilities
 */
export const ISLAMIC_PATTERNS = {
  dots: 'pattern-islamic-dots',
  grid: 'pattern-islamic-grid',
  diagonal: 'pattern-islamic-diagonal',
} as const;

/**
 * Animation Utilities
 */
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
} as const;

/**
 * Responsive Breakpoints
 */
export const BREAKPOINTS = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

/**
 * Helper function to get responsive classes
 */
export function getResponsiveClasses(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string {
  const classes = [base];
  
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  
  return classes.join(' ');
}

/**
 * Helper function to get font class based on language
 */
export function getFontClass(language: 'bengali' | 'english' | 'arabic'): string {
  const fontMap = {
    bengali: 'font-bengali',
    english: 'font-english',
    arabic: 'font-arabic',
  };
  
  return fontMap[language];
}

/**
 * Helper function to get text direction based on language
 */
export function getTextDirection(language: 'bengali' | 'english' | 'arabic'): 'ltr' | 'rtl' {
  return language === 'arabic' ? 'rtl' : 'ltr';
}

/**
 * Islamic Color Palette Helper
 */
export function getIslamicColor(
  color: 'primary' | 'secondary' | 'accent',
  shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 500
): string {
  return DESIGN_TOKENS.colors[color][shade];
}

/**
 * Component Size Variants
 */
export const SIZE_VARIANTS = {
  xs: 'text-xs px-2 py-1',
  sm: 'text-sm px-3 py-2',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3',
  xl: 'text-xl px-8 py-4',
} as const;

/**
 * Islamic Geometric Pattern Generator
 */
export function generateIslamicPattern(
  type: 'dots' | 'grid' | 'diagonal',
  color: string = 'primary-200',
  size: number = 20
): string {
  const patterns = {
    dots: `radial-gradient(circle, var(--${color}) 1px, transparent 1px)`,
    grid: `linear-gradient(var(--${color}) 1px, transparent 1px), linear-gradient(90deg, var(--${color}) 1px, transparent 1px)`,
    diagonal: `repeating-linear-gradient(45deg, transparent, transparent ${size/2}px, var(--${color}) ${size/2}px, var(--${color}) ${size}px)`,
  };
  
  return patterns[type];
}

/**
 * Accessibility Helpers
 */
export const A11Y_CLASSES = {
  srOnly: 'sr-only',
  focusVisible: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary-500 text-white p-2 z-50',
} as const;

/**
 * Print Utilities
 */
export const PRINT_CLASSES = {
  hidden: 'print:hidden',
  visible: 'print:block',
  pageBreak: 'print:break-after-page',
  noPageBreak: 'print:break-inside-avoid',
} as const;