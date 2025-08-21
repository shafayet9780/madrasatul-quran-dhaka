import type { PortableTextBlock } from '@portabletext/types'

export interface MultilingualText {
  bengali: string
  english: string
}

export interface MultilingualSlug {
  bengali: { current: string }
  english: { current: string }
}

export interface MultilingualContent {
  bengali: PortableTextBlock[]
  english: PortableTextBlock[]
}

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt: string
  caption?: MultilingualText
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export interface SEOData {
  metaTitle?: MultilingualText
  metaDescription?: MultilingualText
  ogImage?: SanityImage
}

export interface Page {
  _id: string
  _type: 'page'
  title: MultilingualText
  slug: MultilingualSlug
  content: MultilingualContent
  featuredImage?: SanityImage
  seo?: SEOData
  publishedAt: string
}

export interface NewsEvent {
  _id: string
  _type: 'newsEvent'
  title: MultilingualText
  slug: MultilingualSlug
  excerpt?: MultilingualText
  content: MultilingualContent
  featuredImage: SanityImage
  gallery?: SanityImage[]
  eventDate?: string
  category: 'news' | 'event' | 'achievement' | 'announcement'
  featured: boolean
  publishedAt: string
}

export interface Subject {
  name: MultilingualText
  description?: MultilingualText
  hoursPerWeek?: number
}

export interface CoCurricularActivity {
  name: MultilingualText
  description?: MultilingualText
  category: 'islamic_competition' | 'cultural_program' | 'sports' | 'academic_competition' | 'community_service'
}

export interface AcademicProgram {
  _id: string
  _type: 'academicProgram'
  title: MultilingualText
  slug: MultilingualSlug
  description?: MultilingualText
  ageRange: string
  duration?: string
  islamicCurriculum?: {
    subjects: Subject[]
  }
  nctbCurriculum?: {
    subjects: Subject[]
  }
  coCurricularActivities?: CoCurricularActivity[]
  prerequisites?: MultilingualText
  outcomes?: {
    bengali: string[]
    english: string[]
  }
  featuredImage?: SanityImage
  order: number
}

export interface Education {
  degree?: MultilingualText
  institution?: MultilingualText
  year?: number
}

export interface StaffMember {
  _id: string
  _type: 'staffMember'
  name: MultilingualText
  position: MultilingualText
  department: 'administration' | 'islamic_studies' | 'nctb_curriculum' | 'co_curricular' | 'support_staff'
  qualifications?: {
    bengali: string[]
    english: string[]
  }
  biography?: MultilingualText
  photo?: SanityImage
  specializations?: string[]
  contactEmail?: string
  yearsOfExperience?: number
  education?: Education[]
  displayOrder: number
  isLeadership: boolean
}

export interface Facility {
  _id: string
  _type: 'facility'
  name: MultilingualText
  slug: MultilingualSlug
  description?: MultilingualText
  category: 'academic' | 'islamic' | 'recreational' | 'administrative' | 'support'
  images: SanityImage[]
  capacity?: number
  features?: {
    bengali: string[]
    english: string[]
  }
  specifications?: {
    area?: number
    equipment?: {
      bengali: string[]
      english: string[]
    }
    accessibility?: {
      bengali: string[]
      english: string[]
    }
  }
  safetyFeatures?: {
    bengali: string[]
    english: string[]
  }
  usageSchedule?: MultilingualText
  displayOrder: number
  featured: boolean
}

export interface ContactInfo {
  address?: MultilingualText
  phone?: Array<{
    label?: MultilingualText
    number: string
  }>
  email?: Array<{
    label?: MultilingualText
    address: string
  }>
  officeHours?: MultilingualText
}

export interface SocialMedia {
  facebook?: string
  youtube?: string
  instagram?: string
  twitter?: string
}

export interface AdmissionInfo {
  admissionPhone?: string
  admissionEmail?: string
  admissionHours?: MultilingualText
}

export interface SchoolStatistics {
  yearsOfService?: number
  totalStudents?: number
  graduationRate?: number
  teacherCount?: number
  achievements?: Array<{
    title?: MultilingualText
    value?: string
  }>
}

export interface SiteSettings {
  _id: string
  _type: 'siteSettings'
  title: MultilingualText
  description?: MultilingualText
  logo?: SanityImage
  heroImages?: Array<{
    image: SanityImage
    alt: string
    title?: MultilingualText
    description?: MultilingualText
    order?: number
  }>
  favicon?: SanityImage
  contactInfo?: ContactInfo
  socialMedia?: SocialMedia
  admissionInfo?: AdmissionInfo
  seo?: {
    metaTitle?: MultilingualText
    metaDescription?: MultilingualText
    ogImage?: SanityImage
    keywords?: {
      bengali: string[]
      english: string[]
    }
  }
  statistics?: SchoolStatistics
}