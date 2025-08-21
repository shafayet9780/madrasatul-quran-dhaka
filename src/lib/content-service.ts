import { client, previewClient } from './sanity';
import { sanityFetch } from './sanity-fetch';
import { 
  siteSettingsQuery,
  allPagesQuery,
  pageBySlugQuery,
  allNewsEventsQuery,
  featuredNewsEventsQuery,
  newsEventBySlugQuery,
  allAcademicProgramsQuery,
  academicProgramBySlugQuery,
  allStaffQuery,
  leadershipTeamQuery,
  allFacilitiesQuery,
  featuredFacilitiesQuery,
  facilityBySlugQuery
} from './sanity-queries';
import type {
  SiteSettings,
  Page,
  NewsEvent,
  AcademicProgram,
  StaffMember,
  Facility
} from '@/types/sanity';

/**
 * Content Service for managing all Sanity CMS content
 * Provides centralized access to all content types with preview support
 */
export class ContentService {
  private client;
  private isPreview: boolean;

  constructor(preview = false) {
    this.client = preview ? previewClient : client;
    this.isPreview = preview;
  }

  /**
   * Site Settings
   */
  async getSiteSettings(): Promise<SiteSettings | null> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(siteSettingsQuery);
      }
      return await sanityFetch({
        query: siteSettingsQuery,
        tags: ['siteSettings'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60, // No cache in development
      });
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  }

  /**
   * Pages
   */
  async getAllPages(): Promise<Page[]> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(allPagesQuery);
      }
      return await sanityFetch({
        query: allPagesQuery,
        tags: ['page'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching pages:', error);
      return [];
    }
  }

  async getPageBySlug(slug: string): Promise<Page | null> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(pageBySlugQuery, { slug });
      }
      return await sanityFetch({
        query: pageBySlugQuery,
        params: { slug },
        tags: ['page'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error(`Error fetching page with slug ${slug}:`, error);
      return null;
    }
  }

  /**
   * News & Events
   */
  async getAllNewsEvents(): Promise<NewsEvent[]> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(allNewsEventsQuery);
      }
      return await sanityFetch({
        query: allNewsEventsQuery,
        tags: ['newsEvent'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching news events:', error);
      return [];
    }
  }

  async getFeaturedNewsEvents(limit = 6): Promise<NewsEvent[]> {
    try {
      const query = featuredNewsEventsQuery.replace('[0...6]', `[0...${limit}]`);
      if (this.isPreview) {
        return await this.client.fetch(query);
      }
      return await sanityFetch({
        query,
        tags: ['newsEvent'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching featured news events:', error);
      return [];
    }
  }

  async getNewsEventBySlug(slug: string): Promise<NewsEvent | null> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(newsEventBySlugQuery, { slug });
      }
      return await sanityFetch({
        query: newsEventBySlugQuery,
        params: { slug },
        tags: ['newsEvent'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error(`Error fetching news event with slug ${slug}:`, error);
      return null;
    }
  }

  async getNewsEventsByCategory(category: string): Promise<NewsEvent[]> {
    try {
      const query = `
        *[_type == "newsEvent" && category == $category] | order(publishedAt desc) {
          _id,
          title {
            bengali,
            english
          },
          slug {
            bengali { current },
            english { current }
          },
          excerpt {
            bengali,
            english
          },
          featuredImage {
            ...,
            alt,
            caption {
              bengali,
              english
            }
          },
          eventDate,
          category,
          featured,
          publishedAt
        }
      `;
      return await this.client.fetch(query, { category });
    } catch (error) {
      console.error(`Error fetching news events by category ${category}:`, error);
      return [];
    }
  }

  async getUpcomingEvents(): Promise<NewsEvent[]> {
    try {
      const today = new Date().toISOString();
      const query = `
        *[_type == "newsEvent" && eventDate >= $today] | order(eventDate asc) {
          _id,
          title {
            bengali,
            english
          },
          slug {
            bengali { current },
            english { current }
          },
          excerpt {
            bengali,
            english
          },
          featuredImage {
            ...,
            alt,
            caption {
              bengali,
              english
            }
          },
          eventDate,
          category,
          publishedAt
        }
      `;
      if (this.isPreview) {
        return await this.client.fetch(query, { today });
      }
      return await sanityFetch({
        query,
        params: { today },
        tags: ['newsEvent'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  async searchNewsEvents(searchTerm: string, language: 'bengali' | 'english'): Promise<NewsEvent[]> {
    try {
      const query = `
        *[_type == "newsEvent" && (
          title.${language} match $searchTerm + "*" ||
          excerpt.${language} match $searchTerm + "*"
        )] | order(publishedAt desc) {
          _id,
          title {
            bengali,
            english
          },
          slug {
            bengali { current },
            english { current }
          },
          excerpt {
            bengali,
            english
          },
          featuredImage {
            ...,
            alt,
            caption {
              bengali,
              english
            }
          },
          eventDate,
          category,
          publishedAt
        }
      `;
      if (this.isPreview) {
        return await this.client.fetch(query, { searchTerm });
      }
      return await sanityFetch({
        query,
        params: { searchTerm },
        tags: ['newsEvent'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error(`Error searching news events with term ${searchTerm}:`, error);
      return [];
    }
  }

  /**
   * Academic Programs
   */
  async getAllAcademicPrograms(): Promise<AcademicProgram[]> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(allAcademicProgramsQuery);
      }
      return await sanityFetch({
        query: allAcademicProgramsQuery,
        tags: ['academicProgram'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching academic programs:', error);
      return [];
    }
  }

  async getAcademicProgramBySlug(slug: string): Promise<AcademicProgram | null> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(academicProgramBySlugQuery, { slug });
      }
      return await sanityFetch({
        query: academicProgramBySlugQuery,
        params: { slug },
        tags: ['academicProgram'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error(`Error fetching academic program with slug ${slug}:`, error);
      return null;
    }
  }

  /**
   * Staff
   */
  async getAllStaff(): Promise<StaffMember[]> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(allStaffQuery);
      }
      return await sanityFetch({
        query: allStaffQuery,
        tags: ['staffMember'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  }

  async getLeadershipTeam(): Promise<StaffMember[]> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(leadershipTeamQuery);
      }
      return await sanityFetch({
        query: leadershipTeamQuery,
        tags: ['staffMember'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching leadership team:', error);
      return [];
    }
  }

  async getStaffByDepartment(department: string): Promise<StaffMember[]> {
    try {
      const query = `
        *[_type == "staffMember" && department == $department] | order(displayOrder asc) {
          _id,
          name {
            bengali,
            english
          },
          position {
            bengali,
            english
          },
          department,
          photo {
            ...,
            alt,
            caption {
              bengali,
              english
            }
          },
          displayOrder,
          isLeadership
        }
      `;
      if (this.isPreview) {
        return await this.client.fetch(query, { department });
      }
      return await sanityFetch({
        query,
        params: { department },
        tags: ['staffMember'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error(`Error fetching staff by department ${department}:`, error);
      return [];
    }
  }

  /**
   * Facilities
   */
  async getAllFacilities(): Promise<Facility[]> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(allFacilitiesQuery);
      }
      return await sanityFetch({
        query: allFacilitiesQuery,
        tags: ['facility'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching facilities:', error);
      return [];
    }
  }

  async getFeaturedFacilities(): Promise<Facility[]> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(featuredFacilitiesQuery);
      }
      return await sanityFetch({
        query: featuredFacilitiesQuery,
        tags: ['facility'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error('Error fetching featured facilities:', error);
      return [];
    }
  }

  async getFacilityBySlug(slug: string): Promise<Facility | null> {
    try {
      if (this.isPreview) {
        return await this.client.fetch(facilityBySlugQuery, { slug });
      }
      return await sanityFetch({
        query: facilityBySlugQuery,
        params: { slug },
        tags: ['facility'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error(`Error fetching facility with slug ${slug}:`, error);
      return null;
    }
  }

  async getFacilitiesByCategory(category: string): Promise<Facility[]> {
    try {
      const query = `
        *[_type == "facility" && category == $category] | order(displayOrder asc) {
          _id,
          name {
            bengali,
            english
          },
          slug {
            bengali { current },
            english { current }
          },
          description {
            bengali,
            english
          },
          category,
          images[] {
            ...,
            alt,
            caption {
              bengali,
              english
            }
          },
          capacity,
          displayOrder,
          featured
        }
      `;
      if (this.isPreview) {
        return await this.client.fetch(query, { category });
      }
      return await sanityFetch({
        query,
        params: { category },
        tags: ['facility'],
        revalidate: process.env.NODE_ENV === 'development' ? 0 : 60,
      });
    } catch (error) {
      console.error(`Error fetching facilities by category ${category}:`, error);
      return [];
    }
  }

  /**
   * Content validation helpers
   */
  async validateContent(contentType: string, id: string): Promise<boolean> {
    try {
      const query = `*[_type == $contentType && _id == $id][0]`;
      const result = await this.client.fetch(query, { contentType, id });
      return !!result;
    } catch (error) {
      console.error(`Error validating content ${contentType}:${id}:`, error);
      return false;
    }
  }

  /**
   * Content publishing workflow helpers
   */
  async getUnpublishedContent(contentType: string): Promise<any[]> {
    try {
      const query = `*[_type == $contentType && !defined(publishedAt)] | order(_createdAt desc)`;
      return await this.client.fetch(query, { contentType });
    } catch (error) {
      console.error(`Error fetching unpublished ${contentType}:`, error);
      return [];
    }
  }

  async getRecentlyUpdatedContent(contentType: string, days = 7): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISO = cutoffDate.toISOString();
      
      const query = `*[_type == $contentType && _updatedAt >= $cutoffDate] | order(_updatedAt desc)`;
      return await this.client.fetch(query, { contentType, cutoffDate: cutoffISO });
    } catch (error) {
      console.error(`Error fetching recently updated ${contentType}:`, error);
      return [];
    }
  }
}

// Export singleton instances
export const contentService = new ContentService(false);
export const previewContentService = new ContentService(true);

// Helper function to get the appropriate service
export function getContentService(preview = false): ContentService {
  return preview ? previewContentService : contentService;
}