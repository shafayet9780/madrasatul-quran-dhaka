'use client';

import React, { useRef } from 'react';

interface ClickSparkProps {
  children: React.ReactNode;
  color?: string; // CSS color
  size?: number; // particle size in px
  count?: number; // particle count
}

export function ClickSpark({ children, color = 'var(--color-accent-500)', size = 6, count = 10 }: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'click-spark';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.background = color;
      particle.style.setProperty('--spark-rot', `${Math.random() * 360}deg`);
      particle.style.setProperty('--spark-dist', `${20 + Math.random() * 30}px`);
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 600);
    }
  };

  return (
    <div ref={containerRef} onClick={handleClick} className="relative inline-block">
      {children}
      <style>{`
        .click-spark {
          position: absolute;
          border-radius: 9999px;
          transform: translate(-50%, -50%);
          animation: spark-pop 0.6s ease forwards;
          pointer-events: none;
        }
        @keyframes spark-pop {
          from { opacity: 1; transform: translate(-50%, -50%) rotate(var(--spark-rot)) translateX(0); }
          to { opacity: 0; transform: translate(-50%, -50%) rotate(var(--spark-rot)) translateX(var(--spark-dist)); }
        }
      `}</style>
    </div>
  );
}

export default ClickSpark;


