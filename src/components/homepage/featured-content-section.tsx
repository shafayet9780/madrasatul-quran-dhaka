'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface QuickAccessCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  delay?: number;
}

function QuickAccessCard({ title, description, href, icon, color, delay = 0 }: QuickAccessCardProps) {
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

  return (
    <div 
      ref={cardRef}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Link href={href} className="block group">
        <div className={`card hover:shadow-2xl transition-all duration-300 group-hover:scale-105 border-l-4 ${color}`}>
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-primary-700 mb-2 group-hover:text-primary-600 transition-colors">
                {title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {description}
              </p>
              <div className="mt-4 flex items-center text-primary-600 font-medium group-hover:text-primary-500 transition-colors">
                <span>Learn More</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

interface FeaturedNewsCardProps {
  title: string;
  excerpt: string;
  date: string;
  image: string;
  href: string;
  delay?: number;
}

function FeaturedNewsCard({ title, excerpt, date, image, href, delay = 0 }: FeaturedNewsCardProps) {
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

  return (
    <div 
      ref={cardRef}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Link href={href} className="block group">
        <div className="card hover:shadow-2xl transition-all duration-300 group-hover:scale-105 overflow-hidden p-0">
          <div className="relative h-48 overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                // Fallback to a placeholder if image doesn't exist
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f8e6c8'/%3E%3Ctext x='200' y='100' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='16' fill='%23b8924f'%3ENews Image%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white text-sm font-medium">
              {date}
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-bold text-primary-700 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="text-text-secondary leading-relaxed line-clamp-3">
              {excerpt}
            </p>
            <div className="mt-4 flex items-center text-primary-600 font-medium group-hover:text-primary-500 transition-colors">
              <span>Read More</span>
              <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

interface FeaturedContentSectionProps {
  className?: string;
}

export default function FeaturedContentSection({ className = '' }: FeaturedContentSectionProps) {
  const tNav = useTranslations('navigation');
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const quickAccessItems = [
    {
      title: tNav('admissions'),
      description: 'Start your journey with us. Learn about admission requirements, application process, and important dates.',
      href: '/admissions',
      icon: '📝',
      color: 'border-l-primary-500',
      delay: 0
    },
    {
      title: tNav('programs'),
      description: 'Explore our comprehensive Islamic and NCTB curriculum designed for holistic education.',
      href: '/programs',
      icon: '📚',
      color: 'border-l-secondary-500',
      delay: 200
    },
    {
      title: tNav('contact'),
      description: 'Get in touch with us for any inquiries, campus visits, or additional information.',
      href: '/contact',
      icon: '📞',
      color: 'border-l-accent-500',
      delay: 400
    }
  ];

  const featuredNews = [
    {
      title: 'Annual Quran Competition Results Announced',
      excerpt: 'Our students achieved remarkable success in the district-level Quran recitation competition, bringing honor to our institution.',
      date: 'January 15, 2025',
      image: '/images/news/quran-competition.jpg',
      href: '/news/quran-competition-2025',
      delay: 0
    },
    {
      title: 'New Science Laboratory Inauguration',
      excerpt: 'State-of-the-art science laboratory inaugurated to enhance practical learning experience for our students.',
      date: 'January 10, 2025',
      image: '/images/news/science-lab.jpg',
      href: '/news/science-lab-inauguration',
      delay: 200
    },
    {
      title: 'Admission Open for Academic Year 2025-26',
      excerpt: 'Applications are now open for the new academic year. Limited seats available for all classes.',
      date: 'January 5, 2025',
      image: '/images/news/admission-open.jpg',
      href: '/admissions',
      delay: 400
    }
  ];

  return (
    <section ref={sectionRef} className={`py-16 md:py-24 bg-white relative overflow-hidden ${className}`}>
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 0L93.3 25L93.3 75L50 100L6.7 75L6.7 25Z' fill='%23b8924f' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat'
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        {/* Quick Access Section */}
        <div className="mb-20">
          <div className={`text-center mb-12 transition-all duration-1000 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-700 mb-4">
              Quick Access
            </h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
              Find what you're looking for quickly with our most important sections
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {quickAccessItems.map((item, index) => (
              <QuickAccessCard
                key={index}
                title={item.title}
                description={item.description}
                href={item.href}
                icon={item.icon}
                color={item.color}
                delay={item.delay}
              />
            ))}
          </div>
        </div>

        {/* Featured News Section */}
        <div>
          <div className={`text-center mb-12 transition-all duration-1000 delay-500 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-700 mb-4">
              Latest News & Events
            </h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
              Stay updated with our latest achievements, events, and announcements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featuredNews.map((news, index) => (
              <FeaturedNewsCard
                key={index}
                title={news.title}
                excerpt={news.excerpt}
                date={news.date}
                image={news.image}
                href={news.href}
                delay={news.delay + 600}
              />
            ))}
          </div>

          {/* View All News Button */}
          <div className={`text-center mt-12 transition-all duration-1000 delay-1000 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <Link 
              href="/news"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 hover:scale-105 transition-all duration-300"
            >
              <span>View All News & Events</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Performance Optimization: Preload images */}
      <div className="hidden">
        {featuredNews.map((news, index) => (
          <link key={index} rel="preload" as="image" href={news.image} />
        ))}
      </div>
    </section>
  );
}