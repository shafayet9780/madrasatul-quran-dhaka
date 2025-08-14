import { client } from '@/lib/sanity';
import { NewsEvent } from '@/types/sanity';

// Query to get all news events
export async function getNewsEvents(): Promise<NewsEvent[]> {
  const query = `
    *[_type == "newsEvent"] | order(publishedAt desc) {
      _id,
      _type,
      title,
      slug,
      excerpt,
      content,
      featuredImage {
        ...,
        alt
      },
      gallery[] {
        ...,
        alt,
        caption
      },
      eventDate,
      category,
      featured,
      publishedAt
    }
  `;

  return await client.fetch(query);
}

// Query to get featured news events for homepage
export async function getFeaturedNewsEvents(limit: number = 3): Promise<NewsEvent[]> {
  const query = `
    *[_type == "newsEvent" && featured == true] | order(publishedAt desc) [0...${limit}] {
      _id,
      _type,
      title,
      slug,
      excerpt,
      featuredImage {
        ...,
        alt
      },
      eventDate,
      category,
      publishedAt
    }
  `;

  return await client.fetch(query);
}

// Query to get news events by category
export async function getNewsEventsByCategory(category: string): Promise<NewsEvent[]> {
  const query = `
    *[_type == "newsEvent" && category == $category] | order(publishedAt desc) {
      _id,
      _type,
      title,
      slug,
      excerpt,
      content,
      featuredImage {
        ...,
        alt
      },
      gallery[] {
        ...,
        alt,
        caption
      },
      eventDate,
      category,
      featured,
      publishedAt
    }
  `;

  return await client.fetch(query, { category });
}

// Query to get upcoming events
export async function getUpcomingEvents(): Promise<NewsEvent[]> {
  const today = new Date().toISOString();
  
  const query = `
    *[_type == "newsEvent" && eventDate >= $today] | order(eventDate asc) {
      _id,
      _type,
      title,
      slug,
      excerpt,
      featuredImage {
        ...,
        alt
      },
      eventDate,
      category,
      publishedAt
    }
  `;

  return await client.fetch(query, { today });
}

// Query to get a single news event by slug
export async function getNewsEventBySlug(slug: string, language: 'bengali' | 'english'): Promise<NewsEvent | null> {
  const query = `
    *[_type == "newsEvent" && slug.${language}.current == $slug][0] {
      _id,
      _type,
      title,
      slug,
      excerpt,
      content,
      featuredImage {
        ...,
        alt
      },
      gallery[] {
        ...,
        alt,
        caption
      },
      eventDate,
      category,
      featured,
      publishedAt
    }
  `;

  return await client.fetch(query, { slug });
}

// Query to get recent achievements
export async function getRecentAchievements(limit: number = 6): Promise<NewsEvent[]> {
  const query = `
    *[_type == "newsEvent" && category == "achievement"] | order(publishedAt desc) [0...${limit}] {
      _id,
      _type,
      title,
      slug,
      excerpt,
      featuredImage {
        ...,
        alt
      },
      eventDate,
      category,
      publishedAt
    }
  `;

  return await client.fetch(query);
}

// Query to search news events
export async function searchNewsEvents(searchTerm: string, language: 'bengali' | 'english'): Promise<NewsEvent[]> {
  const query = `
    *[_type == "newsEvent" && (
      title.${language} match $searchTerm + "*" ||
      excerpt.${language} match $searchTerm + "*"
    )] | order(publishedAt desc) {
      _id,
      _type,
      title,
      slug,
      excerpt,
      featuredImage {
        ...,
        alt
      },
      eventDate,
      category,
      publishedAt
    }
  `;

  return await client.fetch(query, { searchTerm });
}