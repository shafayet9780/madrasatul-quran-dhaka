'use client';

import { useTranslations } from 'next-intl';
import {
  MapPin,
  Navigation,
  Bus,
  Car,
  Printer,
  ExternalLink,
  Plus,
  GraduationCap,
  ShoppingBag,
  Trees,
} from 'lucide-react';
import { useState } from 'react';
import type { SiteSettings } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';
import { useLocale } from 'next-intl';

interface GoogleMapEmbedProps {
  mapEmbedUrl?: string;
  address: string;
}

const GoogleMapEmbed = ({ mapEmbedUrl }: GoogleMapEmbedProps) => {
  // Use CMS provided embed URL or fallback to demo
  const mapSrc =
    mapEmbedUrl ||
    `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.9073462084!2d90.37594731498!3d23.750895894586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f12.5!3m3!1m2!1s0x3755bf4a5c5b7c5b%3A0x5c5b7c5b7c5b7c5b!2sMadrasatul%20Quran%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1635000000000!5m2!1sen!2sbd`;

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-md">
      <iframe
        src={mapSrc}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Madrasatul Quran Location"
      />
    </div>
  );
};

const getLandmarkIcon = (iconType: string) => {
  const iconProps = { className: 'w-4 h-4 text-primary-600' };

  switch (iconType) {
    case 'bus':
      return <Bus {...iconProps} />;
    case 'hospital':
      return <Plus {...iconProps} />;
    case 'university':
      return <GraduationCap {...iconProps} />;
    case 'shopping':
      return <ShoppingBag {...iconProps} />;
    case 'park':
      return <Trees {...iconProps} />;
    default:
      return <MapPin {...iconProps} />;
  }
};

const LandmarkCard = ({
  icon,
  title,
  description,
  distance,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  distance?: string;
}) => (
  <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      {distance && (
        <p className="text-xs text-primary-600 mt-1 font-medium">{distance}</p>
      )}
    </div>
  </div>
);

const DirectionCard = ({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) => (
  <div className="p-4 bg-white rounded-lg border border-gray-200">
    <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
    <p className="text-sm text-gray-600 mb-2">{description}</p>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
      {time}
    </span>
  </div>
);

interface LocationMapsProps {
  siteSettings?: SiteSettings | null;
}

export default function LocationMaps({ siteSettings }: LocationMapsProps) {
  const t = useTranslations('contact.location');
  const locale = useLocale() as 'bengali' | 'english';

  const address = siteSettings?.contactInfo?.address
    ? getLocalizedText(siteSettings.contactInfo.address, locale)
    : t('address');

  // Utility function to extract location data from Google Maps embed URL
  const extractLocationData = (url: string) => {
    const lngMatch = url.match(/!2d(-?\d+\.\d+)/);
    const latMatch = url.match(/!3d(-?\d+\.\d+)/);
    const nameMatch = url.match(/!2s([^!]+)/);

    const result: any = {};

    if (lngMatch && latMatch) {
      result.coordinates = {
        longitude: parseFloat(lngMatch[1]),
        latitude: parseFloat(latMatch[1]),
      };
    } else {
      // Fallback coordinates
      result.coordinates = {
        longitude: 90.37594731498,
        latitude: 23.750895894586,
      };
    }

    if (nameMatch) {
      // URL decode the place name
      result.placeName = decodeURIComponent(nameMatch[1]);
    } else {
      result.placeName = 'Madrasatul Quran, Dhaka';
    }

    return result;
  };

  const handleGetDirections = () => {
    // Get location data from the map embed URL (use siteSettings or fallback)
    const mapSrc =
      siteSettings?.locationInfo?.mapEmbedUrl ||
      `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.9073462084!2d90.37594731498!3d23.750895894586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f12.5!3m3!1m2!1s0x3755bf4a5c5b7c5b%3A0x5c5b7c5b7c5b7c5b!2sMadrasatul%20Quran%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1635000000000!5m2!1sen!2sbd`;

    const locationData = extractLocationData(mapSrc);

    // Use place name if available, otherwise fall back to coordinates
    const destination =
      locationData.placeName ||
      `${locationData.coordinates.latitude},${locationData.coordinates.longitude}`;

    const encodedDestination = encodeURIComponent(destination);
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`,
      '_blank'
    );
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Map Section */}
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 text-primary-600 mr-2" />
                {t('interactiveMap')}
              </h3>
              <GoogleMapEmbed
                mapEmbedUrl={siteSettings?.locationInfo?.mapEmbedUrl}
                address={address}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGetDirections}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {t('getDirections')}
              </button>

              <a
                href={
                  siteSettings?.locationInfo?.googleMapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    address
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('viewOnGoogleMaps')}
              </a>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-8">
            {/* Address */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('completeAddress')}
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{address}</p>
              </div>
            </div>

            {/* Nearby Landmarks */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('landmarks.title')}
              </h3>
              <div className="space-y-3">
                {siteSettings?.locationInfo?.landmarks?.map(
                  (landmark, index) => (
                    <LandmarkCard
                      key={index}
                      icon={getLandmarkIcon(landmark.icon)}
                      title={getLocalizedText(landmark.name, locale)}
                      description={getLocalizedText(
                        landmark.description,
                        locale
                      )}
                      distance={landmark.distance}
                    />
                  )
                ) || (
                  // Fallback landmarks
                  <>
                    <LandmarkCard
                      icon={<MapPin className="w-4 h-4 text-primary-600" />}
                      title="Dhanmondi Lake"
                      description={t('landmarks.landmark1')}
                    />
                    <LandmarkCard
                      icon={<MapPin className="w-4 h-4 text-primary-600" />}
                      title="Dhaka University"
                      description={t('landmarks.landmark2')}
                    />
                    <LandmarkCard
                      icon={<Bus className="w-4 h-4 text-primary-600" />}
                      title="Bus Stop"
                      description={t('landmarks.landmark3')}
                    />
                    <LandmarkCard
                      icon={<MapPin className="w-4 h-4 text-primary-600" />}
                      title="Islami Bank Hospital"
                      description={t('landmarks.landmark4')}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transportation Information */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Public Transportation */}
          {/* <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {t('transportation.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Bus className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Bus Routes</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {siteSettings?.locationInfo?.transportation?.busRoutes
                      ? getLocalizedText(siteSettings.locationInfo.transportation.busRoutes, locale)
                      : t('transportation.bus')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Car className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900">Auto-rickshaw & CNG</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {siteSettings?.locationInfo?.transportation?.rickshawInfo
                      ? getLocalizedText(siteSettings.locationInfo.transportation.rickshawInfo, locale)
                      : t('transportation.rickshaw')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Car className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-purple-900">Ride Sharing</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    {siteSettings?.locationInfo?.transportation?.rideSharing
                      ? getLocalizedText(siteSettings.locationInfo.transportation.rideSharing, locale)
                      : t('transportation.uber')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Car className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Parking</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    {siteSettings?.locationInfo?.transportation?.parking
                      ? getLocalizedText(siteSettings.locationInfo.transportation.parking, locale)
                      : t('transportation.parking')}
                  </p>
                </div>
              </div>
            </div>
          </div> */}

          {/* Directions from Major Locations */}
          {/* <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {t('directions.title')}
            </h3>
            <div className="space-y-4">
              {siteSettings?.locationInfo?.directions?.map((direction, index) => (
                <DirectionCard
                  key={index}
                  title={getLocalizedText(direction.from, locale)}
                  description={getLocalizedText(direction.description, locale)}
                  time={direction.estimatedTime || 'N/A'}
                />
              )) || (
                // Fallback directions
                <>
                  <DirectionCard
                    title="From Airport"
                    description={t('directions.fromAirport')}
                    time="45 min"
                  />
                  <DirectionCard
                    title="From Railway Station"
                    description={t('directions.fromStation')}
                    time="30 min"
                  />
                  <DirectionCard
                    title="From Bus Terminal"
                    description={t('directions.fromBusTerminal')}
                    time="40 min"
                  />
                </>
              )}
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}
