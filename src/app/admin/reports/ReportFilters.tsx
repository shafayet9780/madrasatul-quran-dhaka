'use client';

import { useRouter } from 'next/navigation';
import { useId, useOptimistic, useTransition } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';

type Select = { name: string; label: string; value: string; options: { value: string; label: string }[]; more?: boolean };

/**
 * Report filters, applied as soon as one changes: each choice is a menu button, and the rarely
 * changed ones (`more`) share one "আরও বিকল্প" menu. The address keeps only these values and `keep`
 * (e.g. the class on a class page), as the plain GET form before it did.
 */
export function ReportFilters({ action, selects = [], verifiedOnly, keep = {} }: { action: string; selects?: Select[]; verifiedOnly?: boolean; keep?: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const verifiedId = useId();
  const current: Record<string, string> = { ...Object.fromEntries(selects.map((s) => [s.name, s.value])), verified: verifiedOnly ? '1' : '' };
  // The new choice shows at once; the page follows when the server has rendered it.
  const [shown, show] = useOptimistic(current);
  const go = (changes: Record<string, string>) => {
    const next = { ...current, ...changes };
    const query = new URLSearchParams(Object.entries({ ...keep, ...next }).filter(([, v]) => v)).toString();
    start(() => {
      show(next);
      router.replace(query ? `${action}?${query}` : action, { scroll: false });
    });
  };
  const more = selects.filter((s) => s.more);
  const changed = more.filter((s) => shown[s.name] !== (s.options[0]?.value ?? '')).length;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 sv-no-print', pending && 'opacity-60')} role="group" aria-label="ফিল্টার" aria-busy={pending}>
      {selects
        .filter((s) => !s.more)
        .map((s) => {
          const chosen = s.options.find((o) => o.value === shown[s.name]) ?? s.options[0];
          return (
            <DropdownMenu key={s.name}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 max-w-full bg-white px-3 shadow-none">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="truncate">{chosen?.label}</span>
                  <ChevronDown aria-hidden className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="adm min-w-56">
                <DropdownMenuRadioGroup value={shown[s.name]} onValueChange={(v) => go({ [s.name]: v })}>
                  {s.options.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      {more.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 bg-white px-3 shadow-none">
              <SlidersHorizontal aria-hidden className="text-muted-foreground" />
              আরও বিকল্প
              {changed > 0 && <span className="rounded-sm bg-muted px-1.5 text-[13px] font-normal">{bn(changed)}টি বদলানো</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="adm min-w-64">
            {more.map((s, i) => (
              <div key={s.name}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{s.label}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={shown[s.name]} onValueChange={(v) => go({ [s.name]: v })}>
                  {s.options.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {verifiedOnly !== undefined && (
        <label htmlFor={verifiedId} className="flex h-9 cursor-pointer items-center gap-2 px-1 text-sm">
          <Checkbox id={verifiedId} checked={shown.verified === '1'} onCheckedChange={(on) => go({ verified: on === true ? '1' : '' })} />
          শুধু যাচাইকৃত
        </label>
      )}
    </div>
  );
}
