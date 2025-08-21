import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Main client for published content
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: !isDevelopment, // Disable CDN in development for fresh content
})

// Preview client for draft content
export const previewClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false, // Never use CDN for preview content
  token: process.env.SANITY_API_TOKEN,
})

// Image URL builder
const builder = imageUrlBuilder(client)

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}

// Helper function to get the appropriate client
export function getClient(preview?: boolean) {
  return preview ? previewClient : client
}

// Helper function to check if we're in development mode
export function isDevMode(): boolean {
  return isDevelopment;
}