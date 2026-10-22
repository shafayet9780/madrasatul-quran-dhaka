'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const MOVE = 8; // px of scrolling in one direction before the header goes or comes back

/**
 * Keeps the header at the top of the screen while scrolling up, and slides it away while scrolling down. It always
 * shows over its own place at the top of the page, while a menu is open, and while a key has moved focus into it.
 */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const mark = useRef<HTMLDivElement>(null); // where the header starts (under the admission banner, if any)
  const bar = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const root = document.documentElement;
      // Clamped: the bounce past either end of the page counts as no movement.
      const y = Math.min(Math.max(window.scrollY, 0), root.scrollHeight - root.clientHeight);
      const top = mark.current?.offsetTop ?? 0;
      setStuck(y > top);
      if (y <= top + (bar.current?.offsetHeight ?? 0)) {
        setHidden(false);
        last = y;
      } else if (Math.abs(y - last) >= MOVE) {
        setHidden(y > last);
        last = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div ref={mark} aria-hidden />
      <div
        ref={bar}
        className={cn(
          'sticky top-0 z-[45] motion-safe:transition-[translate,box-shadow] motion-safe:duration-300 motion-safe:ease-out-expo',
          stuck && 'shadow-[0_10px_24px_-20px_rgb(44_31_21_/0.6)]',
          hidden && '-translate-y-full shadow-none has-[:focus-visible]:translate-y-0 has-[[aria-expanded=true]]:translate-y-0',
        )}
      >
        {children}
      </div>
    </>
  );
}
