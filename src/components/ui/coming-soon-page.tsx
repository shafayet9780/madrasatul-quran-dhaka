'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface ComingSoonPageProps {
  pageTitle: string;
  expectedLaunch?: string;
}

export default function ComingSoonPage({ 
  pageTitle, 
  expectedLaunch = "Soon" 
}: ComingSoonPageProps) {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-sand-light flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Islamic Decoration */}
        <div className="text-6xl text-primary-700 mb-6">
          ☪️
        </div>
        
        {/* Main Content */}
        <h1 className="text-4xl md:text-5xl font-bold text-primary-700 mb-4">
          {pageTitle}
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Coming Soon
          </h2>
          
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            This page is currently under development. We are working hard to bring you the best experience.
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-primary-600 mb-6">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></span>
          </div>
          
          <p className="text-sm text-gray-500">
            Expected Launch: {expectedLaunch}
          </p>
        </div>
        
        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            🏠 Return Home
          </Link>
          
          <Link
            href="/contact"
            className="bg-white hover:bg-gray-50 text-primary-700 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-primary-600"
          >
            📞 Contact Us
          </Link>
        </div>
        
        {/* Footer Note */}
        <p className="text-sm text-gray-500 mt-8">
          Madrasatul Quran - Excellence in Islamic Education
        </p>
      </div>
    </div>
  );
}