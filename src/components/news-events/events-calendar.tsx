'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { NewsEvent } from '@/types/sanity';
import { EventRSVP } from './event-rsvp';

interface EventsCalendarProps {
  events: NewsEvent[];
}

export function EventsCalendar({ events }: EventsCalendarProps) {
  const t = useTranslations('news.calendar');
  const locale = useLocale();
  const language = locale as 'bengali' | 'english';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<NewsEvent | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    });
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const monthNames = language === 'bengali' 
    ? ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = language === 'bengali'
    ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-primary-600 text-white p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-xl font-bold font-bengali">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="p-2 h-20"></div>;
            }

            const dayEvents = getEventsForDay(day);
            const isToday = 
              day === new Date().getDate() &&
              currentMonth === new Date().getMonth() &&
              currentYear === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`p-2 h-20 border border-gray-200 rounded-lg ${
                  isToday ? 'bg-primary-50 border-primary-300' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event._id}
                        className="text-xs bg-primary-100 text-primary-800 px-1 py-0.5 rounded truncate"
                        title={event.title[language]}
                      >
                        {event.title[language]}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} {t('more')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="border-t bg-gray-50 p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-bengali">
          {t('upcomingEvents')}
        </h3>
        
        {events.length > 0 ? (
          <div className="space-y-3">
            {events
              .filter(event => event.eventDate && new Date(event.eventDate) >= new Date())
              .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event._id} className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 font-bengali">
                      {event.title[language]}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(event.eventDate!).toLocaleDateString(
                        language === 'bengali' ? 'bn-BD' : 'en-US',
                        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </p>
                    {event.category === 'event' && new Date(event.eventDate!) > new Date() && (
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {t('rsvp')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">{t('noUpcomingEvents')}</p>
        )}
      </div>

      {/* RSVP Modal */}
      {selectedEvent && (
        <EventRSVP
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}