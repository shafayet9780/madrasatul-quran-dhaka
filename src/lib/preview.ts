import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { client } from './sanity';

/**
 * Preview mode utilities for Sanity CMS integration
 */

export interface PreviewData {
  token?: string;
  documentId?: string;
  documentType?: string;
  slug?: string;
}

/**
 * Enable preview mode
 */
export async function enablePreview(
  secret: string,
  slug?: string,
  documentType?: string,
  documentId?: string
): Promise<void> {
  // Verify the secret
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    throw new Error('Invalid preview secret');
  }

  // Enable draft mode
  const draft = await draftMode();
  draft.enable();

  // Redirect to the preview URL
  const previewUrl = slug ? `/${slug}` : '/';
  redirect(previewUrl);
}

/**
 * Disable preview mode
 */
export async function disablePreview(): Promise<void> {
  const draft = await draftMode();
  draft.disable();
  redirect('/');
}

/**
 * Check if preview mode is enabled
 */
export async function isPreviewMode(): Promise<boolean> {
  const draft = await draftMode();
  return draft.isEnabled;
}

/**
 * Get preview data from headers
 */
export function getPreviewData(): PreviewData | null {
  // This would typically come from cookies or headers
  // Implementation depends on how preview links are structured
  return null;
}

/**
 * Validate preview token
 */
export async function validatePreviewToken(token: string): Promise<boolean> {
  try {
    // Verify token with Sanity
    const query = '*[_type == "sanity.imageAsset"][0]'; // Simple query to test token
    await client.fetch(query, {}, { token });
    return true;
  } catch (error) {
    console.error('Invalid preview token:', error);
    return false;
  }
}

/**
 * Generate preview URL for a document
 */
export function generatePreviewUrl(
  documentType: string,
  slug: string,
  language: 'bengali' | 'english' = 'bengali'
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const secret = process.env.SANITY_PREVIEW_SECRET;
  
  if (!secret) {
    throw new Error('SANITY_PREVIEW_SECRET is not configured');
  }

  const params = new URLSearchParams({
    secret,
    slug,
    type: documentType,
    lang: language,
  });

  return `${baseUrl}/api/preview?${params.toString()}`;
}

/**
 * Exit preview URL
 */
export function generateExitPreviewUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/exit-preview`;
}

/**
 * Preview banner component props
 */
export interface PreviewBannerProps {
  isPreview: boolean;
  exitUrl?: string;
}

/**
 * Get preview context for components
 */
export async function getPreviewContext() {
  const isPreview = await isPreviewMode();
  
  return {
    isPreview,
    exitUrl: isPreview ? generateExitPreviewUrl() : undefined,
  };
}