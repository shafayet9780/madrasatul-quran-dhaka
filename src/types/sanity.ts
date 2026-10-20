import type { NavigationVisibility } from '@/lib/nav-visibility'
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

export interface Education {
  degree?: MultilingualText
  institution?: MultilingualText
  year?: number
}

export interface Department {
  _id: string
  _type: 'department'
  name: MultilingualText
  slug: MultilingualSlug
  accentColor?: string
  orderRank?: string
}

export interface ProfileSocialLink {
  platform: 'email' | 'facebook' | 'linkedin' | 'twitter' | 'website'
  url: string
}

export interface Director {
  _id: string
  _type: 'director'
  name: MultilingualText
  slug: MultilingualSlug
  designation: MultilingualText
  photo?: SanityImage
  summary?: MultilingualText
  message?: MultilingualContent
  fullBio?: MultilingualContent
  qualifications?: {
    bengali: string[]
    english: string[]
  }
  education?: Education[]
  socialLinks?: ProfileSocialLink[]
  showDetailPage?: boolean
}

export interface Advisor {
  _id: string
  _type: 'advisor'
  name: MultilingualText
  photo?: SanityImage
  summary: MultilingualText
}

export interface Teacher {
  _id: string
  _type: 'teacher'
  name: MultilingualText
  slug: MultilingualSlug
  designation?: MultilingualText
  seniority?: string
  gender: 'male' | 'female'
  department?: Department
  photo?: SanityImage
  summary?: MultilingualText
  fullBio?: MultilingualContent
  subjects?: {
    bengali: string[]
    english: string[]
  }
  qualifications?: {
    bengali: string[]
    english: string[]
  }
  specializations?: string[]
  yearsOfExperience?: number
  education?: Education[]
  orderRank?: string
  showDetailPage?: boolean
}

/** What a school number is for (Studio → School details → Phone numbers). */
export type PhoneUse = 'admissions' | 'accounts' | 'office'

export interface ContactInfo {
  whatsappNumber?: string
  address?: MultilingualText
  phone?: Array<{
    label?: MultilingualText
    number: string
    usedFor?: PhoneUse
    isActive: boolean
  }>
  email?: Array<{
    address: string
    isActive: boolean
  }>
  officeHours?: MultilingualText
}

export interface LocationInfo {
  gettingHere?: Partial<MultilingualText>
  metroStation?: Partial<MultilingualText>
  metroWalk?: string
  mapEmbedUrl?: string
  googleMapsUrl?: string
  landmarks?: Array<{
    name: MultilingualText
    distance?: string
  }>
}

export interface SocialMediaLink {
  platform: string
  url: string
  icon: 'facebook' | 'youtube' | 'twitter' | 'instagram' | 'linkedin'
  isActive: boolean
  order?: number
}

export interface SchoolStatistics {
  totalStudents?: number
  teacherCount?: number
  achievements?: Array<{
    title?: MultilingualText
    value?: string
  }>
}

/** Studio → School details. `navigationVisibility` is Studio → Pages on/off, joined in by the query. */
export interface SiteSettings {
  _id: string
  _type: 'siteSettings'
  logo?: SanityImage
  favicon?: SanityImage
  tagline?: MultilingualText
  mission?: MultilingualText
  defaultMaleAvatar?: SanityImage
  defaultFemaleAvatar?: SanityImage
  contactInfo?: ContactInfo
  locationInfo?: LocationInfo
  socialMedia?: SocialMediaLink[]
  links?: { books?: string; parentLogin?: string; googlePlay?: string; appStore?: string }
  navigationVisibility?: NavigationVisibility
}

/** The main pages with their own title and description in Studio → Search & sharing. */
export type SeoPage = 'home' | 'about' | 'admissions' | 'preAdmission' | 'curriculum' | 'campus' | 'contact' | 'notices' | 'gallery'

/** One policy in Studio → Privacy & cookie policies. */
export interface PolicyText {
  title?: Partial<MultilingualText>
  intro?: Partial<MultilingualText>
  sections?: { heading?: Partial<MultilingualText>; body?: Partial<MultilingualText> }[]
}

/** Studio → Privacy & cookie policies (singleton `policies`). */
export interface Policies {
  updatedAt?: string
  privacy?: PolicyText
  cookies?: PolicyText
}

/** Studio → Search & sharing. Every field is optional: an empty one keeps the site's own wording. */
export interface SeoSettings {
  description?: Partial<MultilingualText>
  shareImage?: Omit<SanityImage, 'alt'> & { alt?: Partial<MultilingualText> }
  pages?: Partial<Record<SeoPage, { title?: Partial<MultilingualText>; description?: Partial<MultilingualText> }>>
}
