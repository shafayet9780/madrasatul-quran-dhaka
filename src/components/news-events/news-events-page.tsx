'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { NewsEvent } from '@/types/sanity';
import { getNewsEvents } from '@/lib/queries/news-events';
import { NewsFilters } from './news-filters';
import { SearchBar } from './search-bar';
import { NewsCard } from './news-card';
import { EventsCalendar } from './events-calendar';
import { PhotoGallery } from './photo-gallery';
import { MediaSlideshow } from './media-slideshow';

export function NewsEventsPage() {
  const t = useTranslations('news');
  const locale = useLocale();
  const language = locale as 'bengali' | 'english';
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'gallery'>(
    'list'
  );

  useEffect(() => {
    const fetchNewsEvents = async () => {
      try {
        setLoading(true);
        const data = await getNewsEvents();
        setNewsEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Error fetching news events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsEvents();
  }, []);

  useEffect(() => {
    let filtered = newsEvents;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const title = event.title[language].toLowerCase();
        const excerpt = event.excerpt?.[language]?.toLowerCase() || '';
        return title.includes(query) || excerpt.includes(query);
      });
    }

    setFilteredEvents(filtered);
  }, [newsEvents, selectedCategory, searchQuery, language]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-bengali">
              {t('title')}
            </h1>
            <p className="text-xl opacity-90 font-bengali">{t('subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 px-6 border-b-2 font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.list')}
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-6 border-b-2 font-medium transition-colors ${
                  activeTab === 'calendar'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.calendar')}
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-4 px-6 border-b-2 font-medium transition-colors ${
                  activeTab === 'gallery'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('tabs.gallery')}
              </button>
            </nav>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {activeTab === 'list' && (
            <div className="max-w-6xl mx-auto">
              {/* Filters and Search */}
              <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                <NewsFilters
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                />
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                />
              </div>

              {/* News Grid */}
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredEvents.map(event => (
                    <NewsCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{t('noResults')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="max-w-4xl mx-auto">
              <EventsCalendar
                events={filteredEvents.filter(e => e.eventDate)}
              />
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Featured Media Slideshow */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-bengali">
                  {t('gallery.featured')}
                </h2>
                <MediaSlideshow
                  events={filteredEvents
                    .filter(e => e.gallery && e.gallery.length > 0)
                    .slice(0, 5)}
                />
              </div>

              {/* Full Photo Gallery */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-bengali">
                  {t('gallery.allPhotos')}
                </h2>
                <PhotoGallery
                  events={filteredEvents.filter(
                    e => e.gallery && e.gallery.length > 0
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
