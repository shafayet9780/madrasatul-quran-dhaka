'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Navigation, Bus, Car, Printer, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface GoogleMapEmbedProps {
  address: string;
}

const GoogleMapEmbed = ({ address }: GoogleMapEmbedProps) => {
  // Using Google Maps Embed API with a placeholder address
  // In production, you would use the actual school address
  const encodedAddress = encodeURIComponent(address);
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodedAddress}`;
  
  // For demo purposes, using a generic embed URL
  const demoMapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.9073462084!2d90.37594731498!3d23.750895894586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755bf4a5c5b7c5b%3A0x5c5b7c5b7c5b7c5b!2sDhanmondi%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1635000000000!5m2!1sen!2sbd`;

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-md">
      <iframe
        src={demoMapSrc}
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

const LandmarkCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  </div>
);

const DirectionCard = ({ title, description, time }: { title: string; description: string; time: string }) => (
  <div className="p-4 bg-white rounded-lg border border-gray-200">
    <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
    <p className="text-sm text-gray-600 mb-2">{description}</p>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
      {time}
    </span>
  </div>
);

export default function LocationMaps() {
  const t = useTranslations('contact.location');
  const [showPrintableDirections, setShowPrintableDirections] = useState(false);

  const handleGetDirections = () => {
    const address = t('address');
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  const handlePrintDirections = () => {
    setShowPrintableDirections(true);
    setTimeout(() => {
      window.print();
      setShowPrintableDirections(false);
    }, 100);
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
                Interactive Map
              </h3>
              <GoogleMapEmbed address={t('address')} />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGetDirections}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </button>
              
              <button
                onClick={handlePrintDirections}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Directions
              </button>
              
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t('address'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Google Maps
              </a>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-8">
            {/* Address */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Complete Address
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800 leading-relaxed">
                  {t('address')}
                </p>
              </div>
            </div>

            {/* Nearby Landmarks */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('landmarks.title')}
              </h3>
              <div className="space-y-3">
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
              </div>
            </div>
          </div>
        </div>

        {/* Transportation Information */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Public Transportation */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {t('transportation.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Bus className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Bus Routes</h4>
                  <p className="text-sm text-blue-700 mt-1">{t('transportation.bus')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Car className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900">Auto-rickshaw & CNG</h4>
                  <p className="text-sm text-green-700 mt-1">{t('transportation.rickshaw')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Car className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-purple-900">Ride Sharing</h4>
                  <p className="text-sm text-purple-700 mt-1">{t('transportation.uber')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Car className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Parking</h4>
                  <p className="text-sm text-gray-700 mt-1">{t('transportation.parking')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Directions from Major Locations */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {t('directions.title')}
            </h3>
            <div className="space-y-4">
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
            </div>
          </div>
        </div>

        {/* Printable Directions (Hidden by default) */}
        {showPrintableDirections && (
          <div className="print:block hidden mt-12 p-8 bg-white">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Directions to Madrasatul Quran
              </h2>
              <p className="text-gray-600 mt-2">{t('address')}</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">By Public Transport:</h3>
                <p className="text-gray-700">{t('transportation.bus')}</p>
                <p className="text-gray-700 mt-2">{t('transportation.rickshaw')}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Nearby Landmarks:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>{t('landmarks.landmark1')}</li>
                  <li>{t('landmarks.landmark2')}</li>
                  <li>{t('landmarks.landmark3')}</li>
                  <li>{t('landmarks.landmark4')}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">From Major Locations:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>{t('directions.fromAirport')}</li>
                  <li>{t('directions.fromStation')}</li>
                  <li>{t('directions.fromBusTerminal')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}