import React from 'react';
import { cn, getFontClass, getTextDirection } from '@/lib/design-system';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-large' | 'caption' | 'overline';
  language?: 'bengali' | 'english' | 'arabic';
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

export function Typography({
  variant,
  language = 'english',
  className,
  children,
  as,
}: TypographyProps) {
  const getVariantClasses = () => {
    const variantMap = {
      h1: 'text-4xl md:text-5xl lg:text-6xl font-bold leading-tight',
      h2: 'text-3xl md:text-4xl lg:text-5xl font-bold leading-tight',
      h3: 'text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight',
      h4: 'text-xl md:text-2xl lg:text-3xl font-semibold leading-tight',
      h5: 'text-lg md:text-xl lg:text-2xl font-medium leading-tight',
      h6: 'text-base md:text-lg lg:text-xl font-medium leading-tight',
      body: 'text-base md:text-lg leading-relaxed',
      'body-large': 'text-lg md:text-xl leading-relaxed',
      caption: 'text-sm md:text-base leading-normal',
      overline: 'text-xs md:text-sm font-medium uppercase tracking-wide leading-normal',
    };
    
    return variantMap[variant];
  };

  const getLanguageSpecificClasses = () => {
    const languageMap = {
      bengali: 'bengali-heading',
      english: '',
      arabic: 'arabic-text',
    };
    
    return languageMap[language];
  };

  const getDefaultElement = () => {
    const elementMap = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      body: 'p',
      'body-large': 'p',
      caption: 'span',
      overline: 'span',
    } as const;
    
    return elementMap[variant];
  };

  const Element = as || getDefaultElement();

  return React.createElement(
    Element,
    {
      className: cn(
        getVariantClasses(),
        getFontClass(language),
        getLanguageSpecificClasses(),
        'text-gray-900',
        className
      ),
      dir: getTextDirection(language),
    },
    children
  );
}

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  language?: 'bengali' | 'english' | 'arabic';
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
}

export function Heading({
  level,
  language = 'english',
  className,
  children,
  gradient = false,
}: HeadingProps) {
  const variant = `h${level}` as const;
  
  return (
    <Typography
      variant={variant}
      language={language}
      className={cn(
        gradient && 'text-gradient-islamic',
        className
      )}
    >
      {children}
    </Typography>
  );
}

interface TextProps {
  size?: 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'accent' | 'gray' | 'white';
  language?: 'bengali' | 'english' | 'arabic';
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

export function Text({
  size = 'base',
  weight = 'normal',
  color = 'gray',
  language = 'english',
  className,
  children,
  as = 'p',
}: TextProps) {
  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'text-sm md:text-base',
      base: 'text-base md:text-lg',
      lg: 'text-lg md:text-xl',
      xl: 'text-xl md:text-2xl',
    };
    
    return sizeMap[size];
  };

  const getWeightClasses = () => {
    const weightMap = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };
    
    return weightMap[weight];
  };

  const getColorClasses = () => {
    const colorMap = {
      primary: 'text-green-600',
      secondary: 'text-blue-600',
      accent: 'text-yellow-600',
      gray: 'text-gray-700',
      white: 'text-white',
    };
    
    return colorMap[color];
  };

  return React.createElement(
    as,
    {
      className: cn(
        getSizeClasses(),
        getWeightClasses(),
        getColorClasses(),
        getFontClass(language),
        'leading-relaxed',
        language === 'bengali' && 'bengali-body',
        language === 'arabic' && 'arabic-text',
        className
      ),
      dir: getTextDirection(language),
    },
    children
  );
}

interface QuoteProps {
  language?: 'bengali' | 'english' | 'arabic';
  author?: string;
  source?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'islamic' | 'highlighted';
}

export function Quote({
  language = 'english',
  author,
  source,
  className,
  children,
  variant = 'default',
}: QuoteProps) {
  const getQuoteClasses = () => {
    const variantMap = {
      default: 'border-l-4 border-gray-300 pl-6 italic',
      islamic: 'border-l-4 border-green-500 pl-6 bg-green-50 p-6 rounded-r-lg',
      highlighted: 'bg-yellow-50 border border-yellow-200 p-6 rounded-lg relative',
    };
    
    return variantMap[variant];
  };

  return (
    <blockquote className={cn(getQuoteClasses(), className)}>
      {variant === 'highlighted' && (
        <div className="absolute -top-2 -left-2 text-4xl text-yellow-500 font-serif">
          &ldquo;
        </div>
      )}
      
      <Text
        language={language}
        size="lg"
        className={cn(
          variant === 'islamic' && 'text-green-800',
          variant === 'highlighted' && 'text-yellow-800'
        )}
      >
        {children}
      </Text>
      
      {(author || source) && (
        <footer className="mt-4">
          {author && (
            <Text
              language={language}
              size="sm"
              weight="medium"
              className="text-gray-600"
            >
              — {author}
            </Text>
          )}
          {source && (
            <Text
              language={language}
              size="sm"
              className="text-gray-500 mt-1"
            >
              {source}
            </Text>
          )}
        </footer>
      )}
    </blockquote>
  );
}

interface ListProps {
  type?: 'ordered' | 'unordered';
  language?: 'bengali' | 'english' | 'arabic';
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'islamic' | 'numbered';
}

export function List({
  type = 'unordered',
  language = 'english',
  className,
  children,
  variant = 'default',
}: ListProps) {
  const getListClasses = () => {
    const variantMap = {
      default: type === 'ordered' ? 'list-decimal' : 'list-disc',
      islamic: type === 'ordered' ? 'list-decimal' : 'list-none',
      numbered: 'list-decimal',
    };
    
    return cn(
      'space-y-2 pl-6',
      variantMap[variant],
      getFontClass(language),
      className
    );
  };

  const Element = type === 'ordered' ? 'ol' : 'ul';

  return (
    <Element
      className={getListClasses()}
      dir={getTextDirection(language)}
    >
      {children}
    </Element>
  );
}

interface ListItemProps {
  language?: 'bengali' | 'english' | 'arabic';
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function ListItem({
  language = 'english',
  className,
  children,
  icon,
}: ListItemProps) {
  return (
    <li className={cn('flex items-start', className)}>
      {icon && (
        <span className="flex-shrink-0 mr-3 mt-1 text-primary-500">
          {icon}
        </span>
      )}
      <Text language={language} className="flex-1">
        {children}
      </Text>
    </li>
  );
}

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  language?: 'bengali' | 'english' | 'arabic';
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = 'primary',
  size = 'md',
  language = 'english',
  className,
  children,
}: BadgeProps) {
  const getVariantClasses = () => {
    const variantMap = {
      primary: 'bg-green-100 text-green-800 border-green-200',
      secondary: 'bg-blue-100 text-blue-800 border-blue-200',
      accent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return variantMap[variant];
  };

  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-2 text-base',
    };
    
    return sizeMap[size];
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        getVariantClasses(),
        getSizeClasses(),
        getFontClass(language),
        className
      )}
      dir={getTextDirection(language)}
    >
      {children}
    </span>
  );
}