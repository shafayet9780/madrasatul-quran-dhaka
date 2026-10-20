import { urlFor } from '@/lib/sanity';
import type { Locale } from '@/lib/i18n';
import type { FixedPhoto, HomePage } from '@/types/home';

/** The photos the site was launched with, and where each is framed. */
const LAUNCH: Record<FixedPhoto, { src: string; position: string }> = {
  building: { src: '/images/home/campus-building.jpg', position: '50% 0%' },
  entrance: { src: '/images/home/campus-entrance.jpg', position: '50% 50%' },
  classroom: { src: '/images/home/campus-classroom.jpg', position: '50% 50%' },
  van: { src: '/images/home/school-van.jpg', position: '50% 70%' },
  whyBooks: { src: '/images/home/why-books.jpg', position: '30% 80%' },
  whyTeachers: { src: '/images/home/why-teachers.jpg', position: '50% 35%' },
};

/**
 * A section photo: Studio → Homepage → Section photos, framed on its hotspot with its own description; while the slot is
 * empty, the launch photo with the description from messages (`launchAlt`).
 */
export function homePhoto(home: HomePage | null | undefined, key: FixedPhoto, locale: Locale, width: number, launchAlt: string): { src: string; alt: string; position: string } {
  const photo = home?.photos?.[key];
  if (!photo?.asset) return { ...LAUNCH[key], alt: launchAlt };
  const { x = 0.5, y = 0.5 } = photo.hotspot ?? {};
  return { src: urlFor(photo).width(width).url(), alt: photo.alt?.[locale]?.trim() || photo.alt?.bengali || '', position: `${x * 100}% ${y * 100}%` };
}
