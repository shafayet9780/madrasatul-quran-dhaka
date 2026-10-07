'use client';

import { useFormStatus } from 'react-dom';
import { LoaderCircle, Lock } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { payNow } from '@/app/[locale]/pre-admission/actions';
import { cn } from '@/lib/utils';

function Submit({ label, variant }: { label: string; variant: 'default' | 'outline' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={cn('h-11 w-full text-[15px]', variant === 'outline' && 'bg-card shadow-none')}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : variant === 'default' && <Lock aria-hidden />}
      {label}
    </Button>
  );
}

/** Opens the SSLCommerz payment page for this device's application. */
export function PayButton({ locale, label, variant = 'default' }: { locale: string; label: string; variant?: 'default' | 'outline' }) {
  return (
    <form action={payNow.bind(null, locale)}>
      <Submit label={label} variant={variant} />
    </form>
  );
}
