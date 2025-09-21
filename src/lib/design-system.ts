import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Tailwind v4 Design System Constants
 * These reference the CSS variables defined in @theme directive
 */
export const DESIGN_TOKENS = {
  // Color palette - Using Tailwind v4 color names that map to CSS variables
  colors: {
    // Primary scale (maps to --color-primary-* variables)
    primary: {
      50: 'primary-50',
      100: 'primary-100', 
      200: 'primary-200',
      300: 'primary-300', // Brand
      400: 'primary-400',
      500: 'primary-500',
      600: 'primary-600',
      700: 'primary-700',
      800: 'primary-800',
      900: 'primary-900',
    },
    // Secondary scale (maps to --color-secondary-* variables)
    secondary: {
      50: 'secondary-50',
      100: 'secondary-100',
      200: 'secondary-200',
      300: 'secondary-300',
      400: 'secondary-400',
      500: 'secondary-500', // Brand Primary
      600: 'secondary-600',
      700: 'secondary-700',
      800: 'secondary-800',
      900: 'secondary-900',
    },
    // Accent scale (maps to --color-accent-* variables)
    accent: {
      50: 'accent-50',
      100: 'accent-100',
      200: 'accent-200',
      300: 'accent-300',
      400: 'accent-400', // Brand
      500: 'accent-500',
      600: 'accent-600',
      700: 'accent-700',
      800: 'accent-800',
      900: 'accent-900',
    },
  },
  
  // Typography - Using Tailwind v4 font families from @theme
  typography: {
    fontFamilies: {
      // These map to --font-family-* variables in @theme
      bengali: 'font-bengali',
      english: 'font-english', 
      arabic: 'font-arabic',
    },
    fontSizes: {
      // Using Tailwind v4 text utilities
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
  },
  
  // Spacing - Using Tailwind v4 spacing utilities
  spacing: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
    '2xl': 'p-16',
    '3xl': 'p-24',
  },
  
  // Border radius - Using Tailwind v4 rounded utilities
  borderRadius: {
    none: 'rounded-none',
    sm: 'rounded-sm',
    base: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    islamic: 'rounded-lg',
    mosque: 'rounded-t-2xl',
  },
  
  // Shadows - Using Tailwind v4 shadow utilities with custom values
  shadows: {
    islamic: 'shadow-lg',
    islamicLg: 'shadow-2xl',
    gold: 'shadow-xl',
    soft: 'shadow-sm',
  },
} as const;

/**
 * Component Variant Classes - Updated for Tailwind v4
 */
export const COMPONENT_VARIANTS = {
  // Button variants using Tailwind v4 utilities and custom CSS classes
  button: {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
    accent: 'btn-accent',
  },
  
  // Card variants using Tailwind v4 utilities and custom CSS classes
  card: {
    default: 'card',
    islamic: 'card-islamic',
  },
  
  // Input variants using Tailwind v4 utilities and custom CSS classes
  input: {
    default: 'form-input',
    textarea: 'form-textarea',
    select: 'form-select',
  },
  
  // Typography variants using Tailwind v4 color utilities
  heading: {
    primary: 'text-primary-700 font-bold',
    secondary: 'text-secondary-700 font-semibold',
    tertiary: 'text-accent-700 font-medium',
  },
  
  text: {
    body: 'text-secondary-800',
    bodyLarge: 'text-lg text-secondary-800',
    muted: 'text-secondary-600',
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
 * Helper function to get font class based on language - Updated for Tailwind v4
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
 * Islamic Color Palette Helper - Updated for Tailwind v4
 * Returns Tailwind v4 color class names
 */
export function getIslamicColor(
  color: 'primary' | 'secondary' | 'accent',
  shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 500
): string {
  return DESIGN_TOKENS.colors[color][shade];
}

/**
 * Helper function to get background color classes
 */
export function getBgColor(
  color: 'primary' | 'secondary' | 'accent',
  shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 500
): string {
  return `bg-${DESIGN_TOKENS.colors[color][shade]}`;
}

/**
 * Helper function to get text color classes
 */
export function getTextColor(
  color: 'primary' | 'secondary' | 'accent',
  shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 500
): string {
  return `text-${DESIGN_TOKENS.colors[color][shade]}`;
}

/**
 * Helper function to get border color classes
 */
export function getBorderColor(
  color: 'primary' | 'secondary' | 'accent',
  shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 = 500
): string {
  return `border-${DESIGN_TOKENS.colors[color][shade]}`;
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
 * Islamic Geometric Pattern Generator - Updated for Tailwind v4
 */
export function generateIslamicPattern(
  type: 'dots' | 'grid' | 'diagonal',
  color: string = 'primary-200',
  size: number = 20
): string {
  const patterns = {
    dots: `radial-gradient(circle, var(--color-${color}) 1px, transparent 1px)`,
    grid: `linear-gradient(var(--color-${color}) 1px, transparent 1px), linear-gradient(90deg, var(--color-${color}) 1px, transparent 1px)`,
    diagonal: `repeating-linear-gradient(45deg, transparent, transparent ${size/2}px, var(--color-${color}) ${size/2}px, var(--color-${color}) ${size}px)`,
  };
  
  return patterns[type];
}

/**
 * Accessibility Helpers - Updated for Tailwind v4
 */
export const A11Y_CLASSES = {
  srOnly: 'sr-only',
  focusVisible: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary-500 text-white p-2 z-50',
  focusIslamic: 'focus-islamic',
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