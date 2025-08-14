import { MetadataRoute } from 'next';
import { generateSitemap } from '@/lib/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return await generateSitemap();
}