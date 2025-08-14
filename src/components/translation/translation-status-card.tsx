'use client';

import { clsx } from 'clsx';

interface TranslationStatusCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function TranslationStatusCard({ 
  title, 
  value, 
  color, 
  subtitle,
  trend 
}: TranslationStatusCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-500',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-500',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'text-yellow-500',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-500',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={clsx('rounded-lg border border-gray-200 p-4', classes.bg)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={clsx('text-2xl font-bold', classes.text)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {trend && (
          <div className="text-right">
            <div className={clsx(
              'flex items-center text-xs',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <span className="mr-1">
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {Math.abs(trend.value)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}