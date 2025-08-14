'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface StatisticCardProps {
  number: number;
  label: string;
  suffix?: string;
  icon?: string;
  delay?: number;
}

function StatisticCard({ number, label, suffix = '', icon, delay = 0 }: StatisticCardProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = number / steps;
        let current = 0;

        const counter = setInterval(() => {
          current += increment;
          if (current >= number) {
            setCount(number);
            clearInterval(counter);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(counter);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, number, delay]);

  return (
    <div 
      ref={cardRef}
      className={`stats-card transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {icon && (
        <div className="mb-3 flex justify-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      )}
      <div className="stats-number">
        {count}{suffix}
      </div>
      <div className="stats-label">{label}</div>
    </div>
  );
}

interface MissionStatisticsSectionProps {
  className?: string;
}

export default function MissionStatisticsSection({ className = '' }: MissionStatisticsSectionProps) {
  const t = useTranslations('homepage');
  const [missionVisible, setMissionVisible] = useState(false);
  const missionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMissionVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (missionRef.current) {
      observer.observe(missionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const statistics = [
    { number: 500, label: t('statistics.students'), suffix: '+', icon: '👨‍🎓', delay: 0 },
    { number: 25, label: t('statistics.teachers'), suffix: '+', icon: '👨‍🏫', delay: 200 },
    { number: 15, label: t('statistics.years'), suffix: '+', icon: '🏛️', delay: 400 },
    { number: 1000, label: t('statistics.graduates'), suffix: '+', icon: '🎓', delay: 600 },
  ];

  return (
    <section className={`bg-sand-light relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10L60 30L80 30L65 45L70 65L50 55L30 65L35 45L20 30L40 30Z' fill='%23b8924f' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
            backgroundRepeat: 'repeat'
          }}
        />
      </div>

      <div className="container-custom py-12 md:py-20 relative z-10">
        {/* Mission Section */}
        <div 
          ref={missionRef}
          className={`text-center mb-16 md:mb-20 transition-all duration-1000 ${
            missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-4xl mx-auto">
            {/* Mission Title with Islamic Decoration */}
            <div className="flex items-center justify-center mb-8">
              <div className="hidden sm:block w-16 h-px bg-gradient-to-r from-transparent to-primary-400"></div>
              <div className="mx-4 text-center">
                <div className="w-2 h-2 bg-primary-500 rounded-full mx-auto mb-2"></div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-700 px-4">
                  {t('mission.title')}
                </h2>
                <div className="w-2 h-2 bg-primary-500 rounded-full mx-auto mt-2"></div>
              </div>
              <div className="hidden sm:block w-16 h-px bg-gradient-to-l from-transparent to-primary-400"></div>
            </div>

            {/* Mission Description */}
            <div className="relative">
              <p className="text-lg md:text-xl lg:text-2xl text-text-secondary leading-relaxed px-4 mb-8">
                {t('mission.description')}
              </p>
              
              {/* Decorative Quote Marks */}
              <div className="absolute -top-4 -left-2 text-6xl text-primary-200 font-serif leading-none select-none">
                &ldquo;
              </div>
              <div className="absolute -bottom-8 -right-2 text-6xl text-primary-200 font-serif leading-none select-none">
                &rdquo;
              </div>
            </div>

            {/* Campus Image */}
            <div className="mt-12 relative">
              <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                <OptimizedImage
                  image="/images/campus-mission.jpg"
                  alt="Madrasatul Quran Campus - Islamic Education Excellence"
                  width={800}
                  height={400}
                  className="w-full h-64 md:h-80 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to a placeholder if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23f8e6c8'/%3E%3Ctext x='400' y='200' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='24' fill='%23b8924f'%3EMadrasatul Quran Campus%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="text-center">
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-primary-700 mb-12 transition-all duration-1000 delay-300 ${
            missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Our Achievements
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {statistics.map((stat, index) => (
              <StatisticCard
                key={index}
                number={stat.number}
                label={stat.label}
                suffix={stat.suffix}
                icon={stat.icon}
                delay={stat.delay}
              />
            ))}
          </div>
        </div>

        {/* Additional Visual Elements */}
        <div className="mt-16 flex justify-center space-x-8 opacity-30">
          <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </section>
  );
}