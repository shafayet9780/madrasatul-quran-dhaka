'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Search, Filter, MapPin, Users, Clock, Wifi, BookOpen, Microscope, Dumbbell, Shield } from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  description: string;
  category: 'islamic' | 'academic' | 'recreational' | 'administrative' | 'medical';
  image: string;
  capacity?: number;
  features: string[];
  icon: React.ReactNode;
  isModern?: boolean;
}

// Mock data for facilities - in real implementation, this would come from Sanity CMS
const facilities: Facility[] = [
  // Islamic Facilities
  {
    id: '1',
    name: 'Main Prayer Hall (Musalla)',
    description: 'Spacious prayer hall with beautiful Islamic architecture, accommodating 500+ students for daily prayers and special occasions.',
    category: 'islamic',
    image: '/images/campus/prayer-hall.jpg',
    capacity: 500,
    features: ['Air Conditioned', 'Sound System', 'Mihrab', 'Separate Women\'s Section', 'Wudu Area'],
    icon: <div className="w-6 h-6 text-green-600">🕌</div>
  },
  {
    id: '2',
    name: 'Quran Memorization Rooms',
    description: 'Peaceful, acoustically designed rooms specifically for Quran memorization and recitation practice.',
    category: 'islamic',
    image: '/images/campus/quran-room.jpg',
    capacity: 25,
    features: ['Soundproof', 'Individual Study Spaces', 'Quran Stands', 'Audio System', 'Natural Lighting'],
    icon: <BookOpen className="w-6 h-6 text-green-600" />
  },
  {
    id: '3',
    name: 'Islamic Library',
    description: 'Comprehensive collection of Islamic books, Tafsir, Hadith collections, and religious texts in Arabic, Bengali, and English.',
    category: 'islamic',
    image: '/images/campus/islamic-library.jpg',
    capacity: 100,
    features: ['5000+ Islamic Books', 'Digital Quran Collection', 'Research Area', 'Quiet Study Zones'],
    icon: <BookOpen className="w-6 h-6 text-green-600" />
  },
  
  // Academic Facilities
  {
    id: '4',
    name: 'Smart Classrooms',
    description: 'Modern classrooms equipped with interactive smart boards, projectors, and contemporary furniture for enhanced learning.',
    category: 'academic',
    image: '/images/campus/classroom-1.jpg',
    capacity: 40,
    features: ['Interactive Smart Boards', 'Air Conditioning', 'Ergonomic Furniture', 'Audio-Visual Equipment'],
    icon: <div className="w-6 h-6 text-blue-600">📚</div>,
    isModern: true
  },
  {
    id: '5',
    name: 'Science Laboratories',
    description: 'Fully equipped physics, chemistry, and biology laboratories with modern instruments and safety equipment.',
    category: 'academic',
    image: '/images/campus/science-lab.jpg',
    capacity: 30,
    features: ['Modern Equipment', 'Safety Systems', 'Fume Hoods', 'Digital Microscopes', 'Chemical Storage'],
    icon: <Microscope className="w-6 h-6 text-blue-600" />,
    isModern: true
  },
  {
    id: '6',
    name: 'Computer Laboratory',
    description: 'State-of-the-art computer lab with high-speed internet, latest software, and modern PCs for digital literacy.',
    category: 'academic',
    image: '/images/campus/computer-lab.jpg',
    capacity: 35,
    features: ['50+ Modern PCs', 'High-Speed Internet', 'Programming Software', 'Multimedia Tools', 'Server Room'],
    icon: <div className="w-6 h-6 text-blue-600">💻</div>,
    isModern: true
  },
  {
    id: '7',
    name: 'Central Library',
    description: 'Comprehensive library with over 10,000 books in Bengali, English, and Arabic, plus digital resources.',
    category: 'academic',
    image: '/images/campus/library.jpg',
    capacity: 150,
    features: ['10,000+ Books', 'Digital Resources', 'Study Carrels', 'Group Study Rooms', 'Librarian Assistance'],
    icon: <BookOpen className="w-6 h-6 text-blue-600" />,
    isModern: true
  },

  // Recreational Facilities
  {
    id: '8',
    name: 'Sports Ground',
    description: 'Large multi-purpose playground for cricket, football, basketball, and other outdoor activities.',
    category: 'recreational',
    image: '/images/campus/playground.jpg',
    capacity: 200,
    features: ['Cricket Pitch', 'Football Field', 'Basketball Court', 'Running Track', 'Spectator Area'],
    icon: <Dumbbell className="w-6 h-6 text-orange-600" />,
    isModern: true
  },
  {
    id: '9',
    name: 'Indoor Sports Hall',
    description: 'Climate-controlled indoor facility for badminton, table tennis, and other indoor sports activities.',
    category: 'recreational',
    image: '/images/campus/indoor-sports.jpg',
    capacity: 80,
    features: ['Badminton Courts', 'Table Tennis', 'Volleyball Court', 'Air Conditioning', 'Equipment Storage'],
    icon: <Dumbbell className="w-6 h-6 text-orange-600" />,
    isModern: true
  },

  // Administrative Facilities
  {
    id: '10',
    name: 'Administrative Office',
    description: 'Main administrative building housing principal office, staff rooms, and administrative departments.',
    category: 'administrative',
    image: '/images/campus/admin-office.jpg',
    capacity: 50,
    features: ['Principal Office', 'Staff Rooms', 'Meeting Rooms', 'Reception Area', 'Records Office'],
    icon: <div className="w-6 h-6 text-purple-600">🏢</div>
  },

  // Medical Facilities
  {
    id: '11',
    name: 'Medical Room',
    description: 'Well-equipped medical facility with qualified nurse for first aid and basic medical care.',
    category: 'medical',
    image: '/images/campus/medical-room.jpg',
    capacity: 10,
    features: ['Qualified Nurse', 'First Aid Equipment', 'Emergency Medicines', 'Rest Area', '24/7 Availability'],
    icon: <Shield className="w-6 h-6 text-red-600" />,
    isModern: true
  }
];

export default function FacilitiesShowcase() {
  const t = useTranslations('campus.facilities');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { key: 'all', label: 'All Facilities', count: facilities.length },
    { key: 'islamic', label: 'Islamic Facilities', count: facilities.filter(f => f.category === 'islamic').length },
    { key: 'academic', label: 'Academic Facilities', count: facilities.filter(f => f.category === 'academic').length },
    { key: 'recreational', label: 'Recreational', count: facilities.filter(f => f.category === 'recreational').length },
    { key: 'administrative', label: 'Administrative', count: facilities.filter(f => f.category === 'administrative').length },
    { key: 'medical', label: 'Medical', count: facilities.filter(f => f.category === 'medical').length }
  ];

  const filteredFacilities = useMemo(() => {
    let filtered = facilities;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(facility => facility.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(facility =>
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.features.some(feature => 
          feature.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  }, [selectedCategory, searchTerm]);

  const islamicFacilities = facilities.filter(f => f.category === 'islamic');
  const modernFacilities = facilities.filter(f => f.isModern);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-sand-light via-white to-primary-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 text-primary-600 mr-3">🏛️</div>
            <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
              Our Facilities
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            {t('title')}
          </h2>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Islamic vs Modern Facilities Overview */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Islamic Facilities */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl mr-4">
                🕌
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">{t('islamic.title')}</h3>
                <p className="text-green-600">{islamicFacilities.length} Facilities</p>
              </div>
            </div>
            <p className="text-green-700 mb-4">{t('islamic.subtitle')}</p>
            <div className="flex flex-wrap gap-2">
              {islamicFacilities.slice(0, 3).map(facility => (
                <span key={facility.id} className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">
                  {facility.name.split(' ')[0]} {facility.name.split(' ')[1]}
                </span>
              ))}
            </div>
          </div>

          {/* Modern Facilities */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl mr-4">
                🔬
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-800">{t('modern.title')}</h3>
                <p className="text-blue-600">{modernFacilities.length} Facilities</p>
              </div>
            </div>
            <p className="text-blue-700 mb-4">{t('modern.subtitle')}</p>
            <div className="flex flex-wrap gap-2">
              {modernFacilities.slice(0, 3).map(facility => (
                <span key={facility.id} className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">
                  {facility.name.split(' ')[0]} {facility.name.split(' ')[1]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-12">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full lg:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              {t('filterBy')}
            </button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      selectedCategory === category.key
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {category.label} ({category.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group transform hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={facility.image}
                  alt={facility.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    facility.category === 'islamic' ? 'bg-green-100 text-green-700' :
                    facility.category === 'academic' ? 'bg-blue-100 text-blue-700' :
                    facility.category === 'recreational' ? 'bg-orange-100 text-orange-700' :
                    facility.category === 'medical' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {categories.find(c => c.key === facility.category)?.label}
                  </span>
                </div>

                {/* Modern Badge */}
                {facility.isModern && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 bg-accent-500 text-white rounded-full text-xs font-medium">
                      Modern
                    </span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {facility.icon}
                    <h3 className="font-bold text-text-primary ml-2 group-hover:text-primary-700 transition-colors">
                      {facility.name}
                    </h3>
                  </div>
                  {facility.capacity && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {facility.capacity}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                  {facility.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="font-medium text-text-primary text-sm">Key Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {facility.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                    {facility.features.length > 3 && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-600 rounded text-xs">
                        +{facility.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredFacilities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No facilities found</h3>
            <p className="text-text-secondary">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </section>
  );
}