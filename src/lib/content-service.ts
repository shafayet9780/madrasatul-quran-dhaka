import type { FeeSettings } from '@/types/fees';
import type { HomePage, Testimonial } from '@/types/home';
import type { CampusStopIn } from '@/lib/campus/day';
import type { AlbumIn } from '@/lib/gallery/albums';
import { SAMPLE_ALBUMS } from '@/lib/gallery/testing/sample-albums';
import type { NoticeIn } from '@/lib/notices/notices';
import { SAMPLE_NOTICES } from '@/lib/notices/testing/sample-notices';
import { localOverrides } from '@/lib/admissions/local';
import { albumBySlugQuery, campusDayQuery, galleryAlbumsQuery, feeSettingsQuery, homePageQuery, homeTestimonialsQuery, noticeByNumberQuery, noticesQuery, seoSettingsQuery, siteSettingsQuery } from './sanity-queries';
import { client, previewClient } from './sanity';
import { sanityFetch } from './sanity-fetch';
import type { SeoSettings, SiteSettings } from '@/types/sanity';
import { phoneUse } from './admissions-contact';

/** Until the clean-up script has run (docs/studio-cleanup.md): old phones get the use the script will give them. */
export function withPhoneUses(settings: SiteSettings | null): SiteSettings | null {
  const contact = settings?.contactInfo as (SiteSettings['contactInfo'] & { admissionsPhone?: string }) | undefined;
  if (!settings || !contact?.phone?.some((p) => !p.usedFor)) return settings;
  return { ...settings, contactInfo: { ...contact, phone: contact.phone.map((p) => ({ ...p, usedFor: phoneUse(p, contact.admissionsPhone) })) } };
}

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

  async getFeeSettings(): Promise<FeeSettings | null> {
    try {
      if (this.isPreview) return await this.client.fetch(feeSettingsQuery);
      return await sanityFetch({ query: feeSettingsQuery, tags: ['feeSettings'] });
    } catch (error) {
      console.error('Error fetching fee settings:', error);
      return null;
    }
  }

  /** Studio → Homepage: the routine, play-space photos and FAQ. */
  async getHomePage(): Promise<HomePage | null> {
    try {
      if (this.isPreview) return await this.client.fetch(homePageQuery);
      return await sanityFetch({ query: homePageQuery, tags: ['homePage'] });
    } catch (error) {
      console.error('Error fetching the homepage content:', error);
      return null;
    }
  }

  /** Studio → Search & sharing (none in the local preview: the site's own wording shows). */
  async getSeoSettings(): Promise<SeoSettings | null> {
    if (localOverrides()) return null;
    try {
      if (this.isPreview) return await this.client.fetch(seoSettingsQuery);
      return await sanityFetch<SeoSettings | null>({ query: seoSettingsQuery, tags: ['seoSettings'] });
    } catch (error) {
      console.error('Error fetching search & sharing settings:', error);
      return null;
    }
  }

  /** Studio → Campus: a day: the stops, in order (none while the list is empty). */
  async getCampusDay(): Promise<CampusStopIn[]> {
    try {
      if (this.isPreview) return (await this.client.fetch(campusDayQuery)) ?? [];
      return (await sanityFetch<CampusStopIn[] | null>({ query: campusDayQuery, tags: ['campusDay'] })) ?? [];
    } catch (error) {
      console.error('Error fetching the campus day:', error);
      return [];
    }
  }

  /** Studio → Gallery: every album shown, newest first, with its first three photos. The local preview has samples. */
  async getAlbums(): Promise<AlbumIn[]> {
    if (localOverrides()) return SAMPLE_ALBUMS.map((a) => ({ ...a, photos: a.photos?.slice(0, 3) }));
    try {
      if (this.isPreview) return (await this.client.fetch(galleryAlbumsQuery)) ?? [];
      return (await sanityFetch<AlbumIn[] | null>({ query: galleryAlbumsQuery, tags: ['album'] })) ?? [];
    } catch (error) {
      console.error('Error fetching the gallery:', error);
      return [];
    }
  }

  /** One album, with all its photos. */
  async getAlbum(slug: string): Promise<AlbumIn | null> {
    if (localOverrides()) return SAMPLE_ALBUMS.find((a) => a.slug === slug) ?? null;
    try {
      if (this.isPreview) return await this.client.fetch(albumBySlugQuery, { slug });
      return await sanityFetch<AlbumIn | null>({ query: albumBySlugQuery, params: { slug }, tags: ['album'] });
    } catch (error) {
      console.error('Error fetching the album:', error);
      return null;
    }
  }

  /** Studio → Notices: every notice shown, newest first. The local preview has samples. */
  async getNotices(): Promise<NoticeIn[]> {
    if (localOverrides()) return SAMPLE_NOTICES;
    try {
      if (this.isPreview) return (await this.client.fetch(noticesQuery)) ?? [];
      return (await sanityFetch<NoticeIn[] | null>({ query: noticesQuery, tags: ['notice'] })) ?? [];
    } catch (error) {
      console.error('Error fetching the notices:', error);
      return [];
    }
  }

  /** One notice, by its number (its link). */
  async getNotice(year: number, serial: number): Promise<NoticeIn | null> {
    if (localOverrides()) return SAMPLE_NOTICES.find((n) => n.number?.year === year && n.number?.serial === serial) ?? null;
    try {
      if (this.isPreview) return await this.client.fetch(noticeByNumberQuery, { year, serial });
      return await sanityFetch<NoticeIn | null>({ query: noticeByNumberQuery, params: { year, serial }, tags: ['notice'] });
    } catch (error) {
      console.error('Error fetching the notice:', error);
      return null;
    }
  }

  /** Studio → Guardian reviews: the first three with recorded consent. */
  async getHomeTestimonials(): Promise<Testimonial[]> {
    try {
      if (this.isPreview) return (await this.client.fetch(homeTestimonialsQuery)) ?? [];
      return (await sanityFetch<Testimonial[]>({ query: homeTestimonialsQuery, tags: ['testimonial'] })) ?? [];
    } catch (error) {
      console.error('Error fetching guardian reviews:', error);
      return [];
    }
  }

  /**
   * School details
   */
  async getSiteSettings(): Promise<SiteSettings | null> {
    // The local preview has no Sanity; its sample gallery and notice board are switched on.
    if (localOverrides()) return { navigationVisibility: { showGallery: true, showNotices: true } } as SiteSettings;
    try {
      if (this.isPreview) {
        return withPhoneUses(await this.client.fetch(siteSettingsQuery));
      }
      return withPhoneUses(await sanityFetch({
        query: siteSettingsQuery,
        tags: ['siteSettings', 'pagesOnOff'],
      }));
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
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