import React from 'react';
import { cn } from '@/lib/design-system';

interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  children: React.ReactNode;
}

export function Container({
  size = 'lg',
  className,
  children,
}: ContainerProps) {
  const getSizeClasses = () => {
    const sizeMap = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };
    
    return sizeMap[size];
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getSizeClasses(), className)}>
      {children}
    </div>
  );
}

interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  };
  className?: string;
  children: React.ReactNode;
}

export function Grid({
  cols = 1,
  gap = 'md',
  responsive,
  className,
  children,
}: GridProps) {
  const getColsClasses = () => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    };
    
    return colsMap[cols];
  };

  const getGapClasses = () => {
    const gapMap = {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12',
    };
    
    return gapMap[gap];
  };

  const getResponsiveClasses = () => {
    if (!responsive) return '';
    
    const classes = [];
    
    if (responsive.sm) classes.push(`sm:grid-cols-${responsive.sm}`);
    if (responsive.md) classes.push(`md:grid-cols-${responsive.md}`);
    if (responsive.lg) classes.push(`lg:grid-cols-${responsive.lg}`);
    if (responsive.xl) classes.push(`xl:grid-cols-${responsive.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'grid',
        getColsClasses(),
        getGapClasses(),
        getResponsiveClasses(),
        className
      )}
    >
      {children}
    </div>
  );
}

interface FlexProps {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

export function Flex({
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className,
  children,
}: FlexProps) {
  const getDirectionClasses = () => {
    const directionMap = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    };
    
    return directionMap[direction];
  };

  const getAlignClasses = () => {
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };
    
    return alignMap[align];
  };

  const getJustifyClasses = () => {
    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };
    
    return justifyMap[justify];
  };

  const getGapClasses = () => {
    const gapMap = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };
    
    return gapMap[gap];
  };

  return (
    <div
      className={cn(
        'flex',
        getDirectionClasses(),
        getAlignClasses(),
        getJustifyClasses(),
        getGapClasses(),
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}

interface SectionProps {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'gray';
  pattern?: 'dots' | 'grid' | 'diagonal' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

export function Section({
  variant = 'default',
  pattern = 'none',
  padding = 'lg',
  className,
  children,
}: SectionProps) {
  const getVariantClasses = () => {
    const variantMap = {
      default: 'bg-white',
      primary: 'bg-green-50',
      secondary: 'bg-blue-50',
      accent: 'bg-yellow-50',
      gray: 'bg-gray-50',
    };
    
    return variantMap[variant];
  };

  const getPaddingClasses = () => {
    const paddingMap = {
      sm: 'py-8 md:py-12',
      md: 'py-12 md:py-16',
      lg: 'py-16 md:py-20',
      xl: 'py-20 md:py-24',
    };
    
    return paddingMap[padding];
  };

  const getPatternClasses = () => {
    if (pattern === 'none') return '';
    
    const patternMap = {
      dots: 'pattern-islamic-dots',
      grid: 'pattern-islamic-grid',
      diagonal: 'pattern-islamic-diagonal',
    };
    
    return `relative ${patternMap[pattern]}`;
  };

  return (
    <section
      className={cn(
        'relative',
        getVariantClasses(),
        getPaddingClasses(),
        getPatternClasses(),
        className
      )}
    >
      {children}
    </section>
  );
}

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export function Spacer({ size = 'md', className }: SpacerProps) {
  const getSizeClasses = () => {
    const sizeMap = {
      xs: 'h-2',
      sm: 'h-4',
      md: 'h-8',
      lg: 'h-12',
      xl: 'h-16',
      '2xl': 'h-20',
      '3xl': 'h-24',
    };
    
    return sizeMap[size];
  };

  return <div className={cn(getSizeClasses(), className)} />;
}

interface CardProps {
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  hover = true,
}: CardProps) {
  const getVariantClasses = () => {
    const variantMap = {
      default: 'bg-white shadow-lg border border-gray-100',
      elevated: 'bg-white shadow-xl border border-gray-100',
      bordered: 'bg-white border-2 border-green-200 shadow-md',
      gradient: 'bg-gradient-to-br from-green-50 to-blue-50 border border-green-100 shadow-lg',
    };
    
    return variantMap[variant];
  };

  const getPaddingClasses = () => {
    const paddingMap = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };
    
    return paddingMap[padding];
  };

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-300 ease-in-out',
        getVariantClasses(),
        getPaddingClasses(),
        hover && 'hover:shadow-lg hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DividerProps {
  variant?: 'simple' | 'ornate' | 'verse' | 'geometric';
  color?: 'primary' | 'secondary' | 'accent' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Divider({
  variant = 'simple',
  color = 'primary',
  size = 'md',
  spacing = 'md',
  className,
}: DividerProps) {
  const getSpacingClasses = () => {
    const spacingMap = {
      sm: 'my-4',
      md: 'my-6',
      lg: 'my-8',
      xl: 'my-12',
    };
    
    return spacingMap[spacing];
  };

  const getDividerClasses = () => {
    const colorMap = {
      primary: 'bg-gradient-to-r from-transparent via-green-500 to-transparent',
      secondary: 'bg-gradient-to-r from-transparent via-blue-500 to-transparent',
      accent: 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent',
      gray: 'bg-gradient-to-r from-transparent via-gray-300 to-transparent',
    };
    
    const sizeMap = {
      sm: 'h-px w-16',
      md: 'h-0.5 w-24',
      lg: 'h-1 w-32',
    };
    
    return cn(
      'mx-auto rounded-full',
      colorMap[color],
      sizeMap[size]
    );
  };

  const getOrnament = () => {
    if (variant === 'ornate') {
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className={getDividerClasses()} />
          <div className="text-accent-500 text-xl">❋</div>
          <div className={getDividerClasses()} />
        </div>
      );
    }
    
    if (variant === 'verse') {
      return (
        <div className="flex items-center justify-center space-x-3">
          <div className={getDividerClasses()} />
          <div className="text-accent-500 text-2xl font-arabic">۞</div>
          <div className={getDividerClasses()} />
        </div>
      );
    }
    
    if (variant === 'geometric') {
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className={getDividerClasses()} />
          <div className="w-3 h-3 bg-accent-500 rotate-45" />
          <div className={getDividerClasses()} />
        </div>
      );
    }
    
    return <div className={getDividerClasses()} />;
  };

  return (
    <div className={cn('flex items-center justify-center', getSpacingClasses(), className)}>
      {getOrnament()}
    </div>
  );
}