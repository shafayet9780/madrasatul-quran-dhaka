import { groq } from 'next-sanity'

// Common fields for multilingual content
const multilingualTextFields = `
  bengali,
  english
`

const multilingualSlugFields = `
  bengali { current },
  english { current }
`

const imageFields = `
  ...,
  alt,
  caption {
    ${multilingualTextFields}
  }
`

const seoFields = `
  metaTitle {
    ${multilingualTextFields}
  },
  metaDescription {
    ${multilingualTextFields}
  },
  ogImage {
    ${imageFields}
  }
`

// Site Settings Query
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    _id,
    title {
      ${multilingualTextFields}
    },
    description {
      ${multilingualTextFields}
    },
    logo {
      ${imageFields}
    },
    heroImages[] {
      image {
        ${imageFields}
      },
      alt,
      title {
        ${multilingualTextFields}
      },
      description {
        ${multilingualTextFields}
      },
      order
    },
    favicon {
      ${imageFields}
    },
    contactInfo {
      address {
        ${multilingualTextFields}
      },
      phone[] {
        label {
          ${multilingualTextFields}
        },
        number,
        type,
        isPrimary,
        isActive
      },
      email[] {
        label {
          ${multilingualTextFields}
        },
        address,
        type,
        isPrimary,
        isActive
      },
      officeHours {
        ${multilingualTextFields}
      }
    },
    socialMedia[] {
      platform,
      url,
      icon,
      isActive,
      order
    },
    prayerTimes[] {
      prayerName {
        ${multilingualTextFields}
      },
      time,
      isActive,
      order
    },
    departments[] {
      name {
        ${multilingualTextFields}
      },
      head {
        ${multilingualTextFields}
      },
      phone,
      email,
      type,
      isActive
    },
    admissionInfo {
      admissionPhone,
      admissionEmail,
      admissionHours {
        ${multilingualTextFields}
      }
    },
    seo {
      ${seoFields}
    },
    statistics {
      yearsOfService,
      totalStudents,
      graduationRate,
      teacherCount,
      achievements[] {
        title {
          ${multilingualTextFields}
        },
        value
      }
    }
  }
`

// Pages Queries
export const allPagesQuery = groq`
  *[_type == "page"] | order(publishedAt desc) {
    _id,
    title {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    featuredImage {
      ${imageFields}
    },
    publishedAt
  }
`

export const pageBySlugQuery = groq`
  *[_type == "page" && (slug.bengali.current == $slug || slug.english.current == $slug)][0] {
    _id,
    title {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    content {
      bengali,
      english
    },
    featuredImage {
      ${imageFields}
    },
    seo {
      ${seoFields}
    },
    publishedAt
  }
`

// News & Events Queries
export const allNewsEventsQuery = groq`
  *[_type == "newsEvent"] | order(publishedAt desc) {
    _id,
    title {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    excerpt {
      ${multilingualTextFields}
    },
    featuredImage {
      ${imageFields}
    },
    eventDate,
    category,
    featured,
    publishedAt
  }
`

export const featuredNewsEventsQuery = groq`
  *[_type == "newsEvent" && featured == true] | order(publishedAt desc) [0...6] {
    _id,
    title {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    excerpt {
      ${multilingualTextFields}
    },
    featuredImage {
      ${imageFields}
    },
    eventDate,
    category,
    publishedAt
  }
`

export const newsEventBySlugQuery = groq`
  *[_type == "newsEvent" && (slug.bengali.current == $slug || slug.english.current == $slug)][0] {
    _id,
    title {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    excerpt {
      ${multilingualTextFields}
    },
    content {
      bengali,
      english
    },
    featuredImage {
      ${imageFields}
    },
    gallery[] {
      ${imageFields}
    },
    eventDate,
    category,
    featured,
    publishedAt
  }
`

// Academic Programs Queries
export const allAcademicProgramsQuery = groq`
  *[_type == "academicProgram"] | order(order asc) {
    _id,
    title {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    description {
      ${multilingualTextFields}
    },
    ageRange,
    duration,
    islamicCurriculum {
      subjects[] {
        name {
          ${multilingualTextFields}
        },
        description {
          ${multilingualTextFields}
        },
        hoursPerWeek
      }
    },
    nctbCurriculum {
      subjects[] {
        name {
          ${multilingualTextFields}
        },
        description {
          ${multilingualTextFields}
        },
        hoursPerWeek
      }
    },
    coCurricularActivities[] {
      name {
        ${multilingualTextFields}
      },
      description {
        ${multilingualTextFields}
      },
      category
    },
    prerequisites {
      ${multilingualTextFields}
    },
    outcomes {
      bengali,
      english
    },
    featuredImage {
      ${imageFields}
    },
    order
  }
`

export const academicProgramBySlugQuery = groq`
  *[_type == "academicProgram" && (slug.bengali.current == $slug || slug.english.current == $slug)][0] {
    _id,
    title {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    description {
      ${multilingualTextFields}
    },
    ageRange,
    duration,
    islamicCurriculum {
      subjects[] {
        name {
          ${multilingualTextFields}
        },
        description {
          ${multilingualTextFields}
        },
        hoursPerWeek
      }
    },
    nctbCurriculum {
      subjects[] {
        name {
          ${multilingualTextFields}
        },
        description {
          ${multilingualTextFields}
        },
        hoursPerWeek
      }
    },
    coCurricularActivities[] {
      name {
        ${multilingualTextFields}
      },
      description {
        ${multilingualTextFields}
      },
      category
    },
    prerequisites {
      ${multilingualTextFields}
    },
    outcomes {
      bengali,
      english
    },
    featuredImage {
      ${imageFields}
    },
    order
  }
`

// Staff Queries
export const allStaffQuery = groq`
  *[_type == "staffMember"] | order(displayOrder asc) {
    _id,
    name {
      ${multilingualTextFields}
    },
    position {
      ${multilingualTextFields}
    },
    department,
    photo {
      ${imageFields}
    },
    displayOrder,
    isLeadership
  }
`

export const leadershipTeamQuery = groq`
  *[_type == "staffMember" && isLeadership == true] | order(displayOrder asc) {
    _id,
    name {
      ${multilingualTextFields}
    },
    position {
      ${multilingualTextFields}
    },
    department,
    qualifications {
      bengali,
      english
    },
    biography {
      ${multilingualTextFields}
    },
    photo {
      ${imageFields}
    },
    specializations,
    yearsOfExperience,
    education[] {
      degree {
        ${multilingualTextFields}
      },
      institution {
        ${multilingualTextFields}
      },
      year
    },
    displayOrder
  }
`

// Facilities Queries
export const allFacilitiesQuery = groq`
  *[_type == "facility"] | order(displayOrder asc) {
    _id,
    name {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    description {
      ${multilingualTextFields}
    },
    category,
    images[] {
      ${imageFields}
    },
    capacity,
    displayOrder,
    featured
  }
`

export const featuredFacilitiesQuery = groq`
  *[_type == "facility" && featured == true] | order(displayOrder asc) {
    _id,
    name {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    description {
      ${multilingualTextFields}
    },
    category,
    images[] {
      ${imageFields}
    },
    capacity,
    displayOrder
  }
`

export const facilityBySlugQuery = groq`
  *[_type == "facility" && (slug.bengali.current == $slug || slug.english.current == $slug)][0] {
    _id,
    name {
      ${multilingualTextFields}
    },
    slug {
      ${multilingualSlugFields}
    },
    description {
      ${multilingualTextFields}
    },
    category,
    images[] {
      ${imageFields}
    },
    capacity,
    features {
      bengali,
      english
    },
    specifications {
      area,
      equipment {
        bengali,
        english
      },
      accessibility {
        bengali,
        english
      }
    },
    safetyFeatures {
      bengali,
      english
    },
    usageSchedule {
      ${multilingualTextFields}
    },
    displayOrder,
    featured
  }
`

// Footer Query
export const footerQuery = groq`
  *[_type == "footer" && isActive == true][0] {
    _id,
    title {
      ${multilingualTextFields}
    },
    subtitle {
      ${multilingualTextFields}
    },
    description {
      ${multilingualTextFields}
    },
    useGlobalContactInfo,
    useGlobalSocialLinks,
    useGlobalPrayerTimes,
    quickLinks[] {
      label {
        ${multilingualTextFields}
      },
      url,
      isActive,
      order
    },
    legalLinks[] {
      label {
        ${multilingualTextFields}
      },
      url,
      isActive
    },
    copyright {
      ${multilingualTextFields}
    },
    isActive
  }
`