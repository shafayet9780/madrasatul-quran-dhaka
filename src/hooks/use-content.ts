'use client';

import { useState, useEffect, useCallback } from 'react';
import { getContentService } from '@/lib/content-service';
import type {
  SiteSettings,
  Page,
  NewsEvent,
  AcademicProgram,
  StaffMember,
  Facility
} from '@/types/sanity';

/**
 * Custom hooks for content management integration
 */

interface UseContentOptions {
  preview?: boolean;
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
}

interface ContentState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Generic content hook
 */
function useContent<T>(
  fetcher: () => Promise<T>,
  options: UseContentOptions = {}
): ContentState<T> & {
  refresh: () => Promise<void>;
  mutate: (data: T) => void;
} {
  const [state, setState] = useState<ContentState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetcher();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [fetcher]);

  const mutate = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      lastUpdated: new Date(),
    }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh on interval
  useEffect(() => {
    if (options.refreshInterval) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, options.refreshInterval]);

  // Refresh on window focus
  useEffect(() => {
    if (options.revalidateOnFocus) {
      const handleFocus = () => refresh();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refresh, options.revalidateOnFocus]);

  return {
    ...state,
    refresh,
    mutate,
  };
}

/**
 * Site settings hook
 */
export function useSiteSettings(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getSiteSettings(),
    options
  );
}

/**
 * Page content hook
 */
export function usePage(slug: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getPageBySlug(slug),
    options
  );
}

/**
 * News events hook
 */
export function useNewsEvents(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getAllNewsEvents(),
    options
  );
}

/**
 * Featured news events hook
 */
export function useFeaturedNewsEvents(limit = 6, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getFeaturedNewsEvents(limit),
    options
  );
}

/**
 * News event by slug hook
 */
export function useNewsEvent(slug: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getNewsEventBySlug(slug),
    options
  );
}

/**
 * News events by category hook
 */
export function useNewsEventsByCategory(category: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getNewsEventsByCategory(category),
    options
  );
}

/**
 * Academic programs hook
 */
export function useAcademicPrograms(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getAllAcademicPrograms(),
    options
  );
}

/**
 * Academic program by slug hook
 */
export function useAcademicProgram(slug: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getAcademicProgramBySlug(slug),
    options
  );
}

/**
 * Staff members hook
 */
export function useStaff(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getAllStaff(),
    options
  );
}

/**
 * Leadership team hook
 */
export function useLeadershipTeam(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getLeadershipTeam(),
    options
  );
}

/**
 * Staff by department hook
 */
export function useStaffByDepartment(department: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getStaffByDepartment(department),
    options
  );
}

/**
 * Facilities hook
 */
export function useFacilities(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getAllFacilities(),
    options
  );
}

/**
 * Featured facilities hook
 */
export function useFeaturedFacilities(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getFeaturedFacilities(),
    options
  );
}

/**
 * Facility by slug hook
 */
export function useFacility(slug: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getFacilityBySlug(slug),
    options
  );
}

/**
 * Facilities by category hook
 */
export function useFacilitiesByCategory(category: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getFacilitiesByCategory(category),
    options
  );
}

/**
 * Search news events hook
 */
export function useSearchNewsEvents(
  searchTerm: string,
  language: 'bengali' | 'english',
  options: UseContentOptions = {}
) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => searchTerm ? contentService.searchNewsEvents(searchTerm, language) : Promise.resolve([]),
    { ...options, refreshInterval: undefined } // Don't auto-refresh search results
  );
}

/**
 * Upcoming events hook
 */
export function useUpcomingEvents(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getUpcomingEvents(),
    options
  );
}

/**
 * Content validation hook
 */
export function useContentValidation(contentType: string, id: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.validateContent(contentType, id),
    options
  );
}

/**
 * Unpublished content hook
 */
export function useUnpublishedContent(contentType: string, options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getUnpublishedContent(contentType),
    options
  );
}

/**
 * Recently updated content hook
 */
export function useRecentlyUpdatedContent(
  contentType: string,
  days = 7,
  options: UseContentOptions = {}
) {
  const contentService = getContentService(options.preview);
  
  return useContent(
    () => contentService.getRecentlyUpdatedContent(contentType, days),
    options
  );
}

/**
 * Multi-content hook for loading multiple content types at once
 */
export function useMultiContent(options: UseContentOptions = {}) {
  const contentService = getContentService(options.preview);
  
  const [state, setState] = useState<{
    siteSettings: SiteSettings | null;
    featuredNews: NewsEvent[];
    featuredFacilities: Facility[];
    leadershipTeam: StaffMember[];
    loading: boolean;
    error: string | null;
  }>({
    siteSettings: null,
    featuredNews: [],
    featuredFacilities: [],
    leadershipTeam: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [siteSettings, featuredNews, featuredFacilities, leadershipTeam] = await Promise.all([
        contentService.getSiteSettings(),
        contentService.getFeaturedNewsEvents(6),
        contentService.getFeaturedFacilities(),
        contentService.getLeadershipTeam(),
      ]);

      setState({
        siteSettings,
        featuredNews,
        featuredFacilities,
        leadershipTeam,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [contentService]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}