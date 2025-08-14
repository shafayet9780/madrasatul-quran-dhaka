'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

interface PreviewBannerProps {
  exitUrl?: string;
}

export function PreviewBanner({ exitUrl = '/api/exit-preview' }: PreviewBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const t = useTranslations('preview');

  if (!isVisible) {
    return null;
  }

  const handleExit = async () => {
    try {
      // Call the exit preview API
      const response = await fetch('/api/exit-preview', {
        method: 'POST',
      });

      if (response.ok) {
        // Reload the page to exit preview mode
        window.location.reload();
      } else {
        console.error('Failed to exit preview mode');
      }
    } catch (error) {
      console.error('Error exiting preview mode:', error);
      // Fallback: redirect to exit URL
      window.location.href = exitUrl;
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black border-b-2 border-yellow-600">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-5 w-5" />
            <span className="font-medium">
              {t('banner.title', { defaultValue: 'Preview Mode Active' })}
            </span>
            <span className="text-sm opacity-75">
              {t('banner.description', { 
                defaultValue: 'You are viewing unpublished content' 
              })}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExit}
              className="bg-black text-yellow-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {t('banner.exitButton', { defaultValue: 'Exit Preview' })}
            </button>
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-yellow-600 rounded transition-colors"
              aria-label={t('banner.hideButton', { defaultValue: 'Hide banner' })}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Server component wrapper for preview banner
 */
export async function PreviewBannerWrapper() {
  // This would be used in the main layout to conditionally show the banner
  return null; // Implementation depends on how preview state is managed
}