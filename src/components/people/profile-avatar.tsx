'use client';

import { AvatarImage } from '@/components/ui/optimized-image';
import { resolveProfileImage, type AvatarPlaceholders } from '@/lib/profile-avatar';
import type { SanityImage } from '@/types/sanity';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  photo?: SanityImage;
  gender: 'male' | 'female';
  placeholders?: AvatarPlaceholders;
  name: string;
  className?: string;
}

export function ProfileAvatar({ photo, gender, placeholders, name, className }: ProfileAvatarProps) {
  const image = resolveProfileImage(photo, gender, placeholders);

  return (
    <div className={cn('relative overflow-hidden rounded-full bg-gray-100', className)}>
      {image ? (
        <AvatarImage image={image} alt={name} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
          <svg className="h-1/2 w-1/2 text-primary-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      )}
    </div>
  );
}
