'use client';

import { useState, useEffect } from 'react';

export function useScrollVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isDesktop = window.innerWidth >= 1024; // Only apply to desktop (xl breakpoint)
      
      // Always show on mobile/tablet
      if (!isDesktop) {
        setIsVisible(true);
        return;
      }

      // Calculate scroll difference to avoid tiny movements
      const scrollDiff = Math.abs(currentScrollY - lastScrollY);
      
      // Only react to significant scroll movements (more than 5px)
      if (scrollDiff < 5) {
        return;
      }

      // Show when scrolling up or near the top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } 
      // Hide when scrolling down and not near the top
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    // Add throttling
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 10);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return isVisible;
}
