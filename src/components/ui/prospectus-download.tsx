'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

interface ProspectusDownloadProps {
  locale: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export default function ProspectusDownload({ 
  locale, 
  className = '',
  variant = 'primary',
  size = 'md'
}: ProspectusDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const isBengali = locale === 'bn' || locale === 'bengali';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/download-prospectus');
      
      if (!response.ok) {
        throw new Error('Failed to download prospectus');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Madrasatul-Quran-Prospectus.pdf';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      alert(isBengali ? 'ডাউনলোডে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl';
      case 'secondary':
        return 'bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white shadow-lg hover:shadow-xl';
      case 'outline':
        return 'bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl';
      default:
        return 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm';
      case 'md':
        return 'px-6 py-3 text-base';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`
        group inline-flex items-center gap-3 font-semibold rounded-xl 
        transition-all duration-300 transform hover:scale-105 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
    >
      {isDownloading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
      )}
      
      <span>
        {isDownloading 
          ? (isBengali ? 'ডাউনলোড হচ্ছে...' : 'Downloading...')
          : (isBengali ? 'প্রসপেক্টাস ডাউনলোড করুন' : 'Download Prospectus')
        }
      </span>
      
      {!isDownloading && (
        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" />
      )}
    </button>
  );
}
