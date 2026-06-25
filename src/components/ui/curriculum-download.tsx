'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackFileDownload } from '@/lib/analytics/track';

interface CurriculumDownloadProps {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  locale?: 'bengali' | 'english';
}

export default function CurriculumDownload({
  variant = 'primary',
  size = 'md',
  className = '',
  locale = 'english',
}: CurriculumDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // Call the download API
      const response = await fetch('/api/download-curriculum');
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Madrasatul-Quran-Detailed-Curriculum.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);

      trackFileDownload({
        fileCategory: 'curriculum',
        locale,
        ctaSource: 'curriculum_button',
      });
      
    } catch (error) {
      console.error('Error downloading curriculum:', error);
      // You could add a toast notification here
    } finally {
      setIsDownloading(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:border-primary-600';
      case 'ghost':
        return 'text-primary-600 hover:bg-primary-50';
      default:
        return 'bg-primary-400 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-4 py-3 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={cn(
        'inline-flex items-center justify-center space-x-2 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
    >
      {isDownloading ? (
        <>
          <Loader2 className={cn(getIconSize(), 'animate-spin')} />
          <span>
            {locale === 'bengali' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...'}
          </span>
        </>
      ) : (
        <>
          <FileText className={getIconSize()} />
          <span>
            {locale === 'bengali' ? 'বিস্তারিত কারিকুলাম ডাউনলোড' : 'Download Detailed Curriculum'}
          </span>
          <Download className={getIconSize()} />
        </>
      )}
    </button>
  );
}
