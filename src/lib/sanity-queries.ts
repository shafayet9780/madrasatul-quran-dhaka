import { groq } from 'next-sanity';

// Common fields for multilingual content
const multilingualTextFields = `
  bengali,
  english
`;

const imageFields = `
  ...,
  alt,
  caption {
    ${multilingualTextFields}
  }
`;

// Studio → Pages on/off: the switches, read with the site settings as `navigationVisibility`.
export const pagesOnOffProjection = `*[_id == "pagesOnOff"][0]{
  showPeople, showDirectors, showTeachers, showAdvisors, showCampus, showGallery, showNotices,
  showCurriculum, showAdmissions, showContact, showBooks
}`;

// Site Settings Query (Studio → School details)
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    _id,
    logo {
      ${imageFields}
    },
    favicon {
      ${imageFields}
    },
    "tagline": coalesce(tagline, *[_type == "footer" && isActive == true][0].subtitle),
    "mission": coalesce(mission, *[_type == "footer" && isActive == true][0].description),
    contactInfo {
      admissionsPhone, // stand-in until the clean-up script (docs/studio-cleanup.md)
      whatsappNumber,
      address {
        ${multilingualTextFields}
      },
      phone[] {
        label {
          ${multilingualTextFields}
        },
        number,
        usedFor,
        type, // stand-in until the clean-up script
        isActive
      },
      email[] {
        address,
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
    locationInfo {
      mapEmbedUrl,
      googleMapsUrl,
      landmarks[] {
        name {
          ${multilingualTextFields}
        },
        distance
      }
    },
    // The old switches stand in until the clean-up script has made Pages on/off (docs/studio-cleanup.md).
    "navigationVisibility": coalesce(${pagesOnOffProjection}, navigationVisibility)
  }
`;


export const feeSettingsQuery = groq`*[_type == "feeSettings" && _id == "feeSettings"][0]`;

// The old School details fields stand in until the clean-up script has moved them (docs/studio-cleanup.md).
const oldSite = `*[_id == "siteSettings"][0]`;
export const homePageQuery = groq`{
  "home": *[_type == "homePage" && _id == "homePage"][0]{ routine, playSpaces, faq, heroImages, statistics },
  "old": ${oldSite}{ heroImages, statistics }
}{ ...home, "heroImages": coalesce(home.heroImages, old.heroImages)[]{ image{ ${imageFields} }, alt, title }, "statistics": coalesce(home.statistics, old.statistics) }`;

export const seoSettingsQuery = groq`*[_id == "seoSettings"][0]{ description, shareImage, pages }`;

export const campusDayQuery = groq`*[_type == "campusDay" && _id == "campusDay"][0].stops`;

// The gallery: every album shown, with its first photos (the cards and the hero), the count and the videos; one album whole.
const albumFields = `_id, "slug": slug.current, title, evergreen, date, topic, videos[]{ _key, url, title, upright, length }`;
const albumPhotoFields = `_key, asset, hotspot, alt, caption, "ratio": asset->metadata.dimensions.aspectRatio`;
export const galleryAlbumsQuery = groq`*[_type == "album" && show != false && defined(slug.current)] | order(select(evergreen == true => "", date) desc, _createdAt asc){ ${albumFields}, "photoCount": count(photos), "photos": photos[0...3]{ ${albumPhotoFields} } }`;
export const albumBySlugQuery = groq`*[_type == "album" && show != false && slug.current == $slug][0]{ ${albumFields}, summary, story, quote, photos[]{ ${albumPhotoFields} } }`;

// The notice board: every notice shown, newest first, with its attachments (a PDF's address and size); one by its number.
const noticeFields = `_id, number, title, date, type, body, pinnedUntil, attachments[]{ _type, _key, asset, name, alt, "url": asset->url, "size": asset->size, "ratio": asset->metadata.dimensions.aspectRatio }`;
export const noticesQuery = groq`*[_type == "notice" && show != false && defined(number.serial)] | order(date desc, number.serial desc){ ${noticeFields} }`;
export const noticeByNumberQuery = groq`*[_type == "notice" && show != false && number.year == $year && number.serial == $serial][0]{ ${noticeFields} }`;

// Only reviews whose consent is recorded; the homepage shows the first three.
export const homeTestimonialsQuery = groq`*[_type == "testimonial" && consent == true && show != false] | order(orderRank asc, _createdAt asc)[0...3]{ _id, originalLanguage, quote, who, classLine, consent, show }`;
