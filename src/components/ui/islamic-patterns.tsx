import React from 'react';
import { cn } from '@/lib/design-system';

interface IslamicPatternProps {
  pattern: 'dots' | 'grid' | 'diagonal' | 'geometric' | 'arabesque';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent';
  intensity?: 'light' | 'medium' | 'strong';
  size?: 'sm' | 'md' | 'lg';
}

export function IslamicPattern({
  pattern,
  className,
  color = 'primary',
  intensity = 'light',
  size = 'md',
}: IslamicPatternProps) {
  const getPatternClasses = () => {
    const baseClasses = 'absolute inset-0 pointer-events-none';
    
    const colorMap = {
      primary: {
        light: 'opacity-10',
        medium: 'opacity-20',
        strong: 'opacity-30',
      },
      secondary: {
        light: 'opacity-10',
        medium: 'opacity-20',
        strong: 'opacity-30',
      },
      accent: {
        light: 'opacity-10',
        medium: 'opacity-20',
        strong: 'opacity-30',
      },
    };
    
    const sizeMap = {
      sm: 'bg-[length:15px_15px]',
      md: 'bg-[length:20px_20px]',
      lg: 'bg-[length:30px_30px]',
    };
    
    const patternMap = {
      dots: `pattern-islamic-dots ${sizeMap[size]}`,
      grid: `pattern-islamic-grid ${sizeMap[size]}`,
      diagonal: `pattern-islamic-diagonal ${sizeMap[size]}`,
      geometric: `pattern-islamic-geometric ${sizeMap[size]}`,
      arabesque: `pattern-islamic-arabesque ${sizeMap[size]}`,
    };
    
    return cn(
      baseClasses,
      patternMap[pattern],
      colorMap[color][intensity],
      className
    );
  };

  return <div className={getPatternClasses()} />;
}

interface IslamicBorderProps {
  variant: 'simple' | 'ornate' | 'calligraphy' | 'geometric';
  color?: 'primary' | 'secondary' | 'accent';
  thickness?: 'thin' | 'medium' | 'thick';
  className?: string;
  children?: React.ReactNode;
}

export function IslamicBorder({
  variant,
  color = 'primary',
  thickness = 'medium',
  className,
  children,
}: IslamicBorderProps) {
  const getBorderClasses = () => {
    const colorMap = {
      primary: 'border-primary-500',
      secondary: 'border-secondary-500',
      accent: 'border-accent-500',
    };
    
    const thicknessMap = {
      thin: 'border',
      medium: 'border-2',
      thick: 'border-4',
    };
    
    const variantMap = {
      simple: 'rounded-lg',
      ornate: 'rounded-lg border-double',
      calligraphy: 'rounded-md',
      geometric: 'rounded-none',
    };
    
    return cn(
      'relative',
      colorMap[color],
      thicknessMap[thickness],
      variantMap[variant],
      className
    );
  };

  const getDecorativeElements = () => {
    if (variant === 'ornate') {
      return (
        <>
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-accent-500 rounded-full opacity-60" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent-500 rounded-full opacity-60" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-accent-500 rounded-full opacity-60" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-accent-500 rounded-full opacity-60" />
        </>
      );
    }
    
    if (variant === 'calligraphy') {
      return (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-accent-500 text-lg">
          ۞
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={getBorderClasses()}>
      {getDecorativeElements()}
      {children}
    </div>
  );
}

interface IslamicDividerProps {
  variant: 'simple' | 'ornate' | 'verse' | 'geometric';
  color?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IslamicDivider({
  variant,
  color = 'primary',
  size = 'md',
  className,
}: IslamicDividerProps) {
  const getDividerClasses = () => {
    const colorMap = {
      primary: 'bg-gradient-to-r from-transparent via-primary-500 to-transparent',
      secondary: 'bg-gradient-to-r from-transparent via-secondary-500 to-transparent',
      accent: 'bg-gradient-to-r from-transparent via-accent-500 to-transparent',
    };
    
    const sizeMap = {
      sm: 'h-px w-16',
      md: 'h-0.5 w-24',
      lg: 'h-1 w-32',
    };
    
    return cn(
      'mx-auto rounded-full',
      colorMap[color],
      sizeMap[size],
      className
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
    <div className="flex items-center justify-center py-4">
      {getOrnament()}
    </div>
  );
}

interface IslamicCardProps {
  variant: 'default' | 'elevated' | 'bordered' | 'gradient';
  pattern?: 'dots' | 'grid' | 'diagonal' | 'none';
  className?: string;
  children: React.ReactNode;
}

export function IslamicCard({
  variant = 'default',
  pattern = 'none',
  className,
  children,
}: IslamicCardProps) {
  const getCardClasses = () => {
    const variantMap = {
      default: 'bg-white shadow-lg border border-gray-100',
      elevated: 'bg-white shadow-xl border border-gray-100',
      bordered: 'bg-white border-2 border-green-200 shadow-md',
      gradient: 'bg-gradient-to-br from-green-50 to-blue-50 border border-green-100 shadow-lg',
    };
    
    return cn(
      'rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 relative overflow-hidden',
      variantMap[variant],
      className
    );
  };

  return (
    <div className={getCardClasses()}>
      {pattern !== 'none' && (
        <IslamicPattern
          pattern={pattern}
          intensity="light"
          className="absolute inset-0"
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface IslamicButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function IslamicButton({
  variant,
  size = 'md',
  className,
  children,
  onClick,
  disabled = false,
  type = 'button',
}: IslamicButtonProps) {
  const getButtonClasses = () => {
    const variantMap = {
      primary: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
      secondary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
      outline: 'border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white focus:ring-green-500',
      gold: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
      ghost: 'text-green-500 hover:bg-green-50 focus:ring-green-500',
    };
    
    const sizeMap = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };
    
    return cn(
      'font-medium rounded-lg transition-all duration-300 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantMap[variant],
      sizeMap[size],
      className
    );
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={getButtonClasses()}
    >
      {children}
    </button>
  );
}