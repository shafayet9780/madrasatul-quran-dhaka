// Common types for the Madrasatul Quran website

export interface MultilingualText {
  bengali: string;
  english: string;
}

export interface SEOData {
  title: MultilingualText;
  description: MultilingualText;
  keywords?: string[];
  ogImage?: string;
}

export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: MultilingualText;
  caption?: MultilingualText;
}

export interface PageContent {
  _id: string;
  title: MultilingualText;
  slug: MultilingualText;
  content: MultilingualText;
  seo: SEOData;
  publishedAt: string;
}

export interface NewsEvent {
  _id: string;
  title: MultilingualText;
  excerpt: MultilingualText;
  content: MultilingualText;
  featuredImage: SanityImage;
  gallery?: SanityImage[];
  eventDate?: string;
  category: 'news' | 'event' | 'achievement';
  publishedAt: string;
}

export interface AcademicProgram {
  _id: string;
  title: MultilingualText;
  description: MultilingualText;
  curriculum: {
    islamic: Subject[];
    nctb: Subject[];
  };
  ageRange: string;
  duration: string;
  prerequisites: MultilingualText;
  outcomes: MultilingualText;
  featuredImage: SanityImage;
}

export interface Subject {
  name: MultilingualText;
  description: MultilingualText;
  grade?: string;
}

export interface StaffMember {
  _id: string;
  name: MultilingualText;
  position: MultilingualText;
  qualifications: MultilingualText;
  biography: MultilingualText;
  photo: SanityImage;
  specializations: string[];
  contactEmail?: string;
}

export interface Facility {
  _id: string;
  name: MultilingualText;
  description: MultilingualText;
  category: 'academic' | 'islamic' | 'recreational' | 'administrative';
  images: SanityImage[];
  capacity?: number;
  features: MultilingualText[];
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  preferredLanguage: 'bengali' | 'english';
}

export type Language = 'bengali' | 'english';
