'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/design-system';

type SplitMode = 'chars' | 'words';

interface SplitTextProps {
  children: string;
  as?: React.ElementType;
  mode?: SplitMode;
  stagger?: number; // seconds between items
  duration?: number; // seconds
  delay?: number; // base delay seconds
  className?: string;
}

export function SplitText({
  children,
  as = 'div',
  mode = 'words',
  stagger = 0.05,
  duration = 0.6,
  delay = 0,
  className,
}: SplitTextProps) {
  const Tag = as as React.ElementType;

  const parts = useMemo(() => {
    if (!children) return [] as string[];
    return mode === 'chars'
      ? Array.from(children)
      : children.split(/(\s+)/); // keep spaces as tokens
  }, [children, mode]);

  return (
    <Tag className={cn('inline-block align-baseline', className)} aria-label={children}>
      {parts.map((part, index) => {
        const isSpace = /\s+/.test(part);
        if (isSpace) {
          return <span key={`space-${index}`}>{part}</span>;
        }
        const animationDelay = `${delay + index * stagger}s`;
        const animation = `fadeIn ${duration}s ease both, slideUp ${duration}s ease both`;
        return (
          <span
            key={`part-${index}`}
            style={{ animationDelay, animation, display: 'inline-block' }}
          >
            {part}
          </span>
        );
      })}
    </Tag>
  );
}

export default SplitText;


