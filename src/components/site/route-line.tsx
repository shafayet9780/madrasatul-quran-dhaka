import type { CSSProperties, ReactNode } from 'react';
import type { Route } from '@/lib/home/day';
import { cn } from '@/lib/utils';

/**
 * One van route, drawn down to the school as it scrolls in: each stop's dot pops, then the link to the next stop draws.
 * The stop names are plain text; the dots and links are decoration. A dot sits on the first line of its name.
 * `children` go under the route name (the Admissions page puts the vehicle and charge there). Used on the homepage
 * (SchoolDay) and the Admissions page.
 */
export function RouteLine({ route, school, children }: { route: Route; school: string; children?: ReactNode }) {
  const stops = [...route.stops, school];
  const at = (i: number) => i / (stops.length - 1);
  return (
    <div className="flex min-w-0 flex-col gap-3 [view-timeline-name:--route]">
      <strong className="text-17 font-bold">{route.name}</strong>
      {children}
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {stops.map((stop, i) => {
          const last = i === stops.length - 1;
          return (
            <li key={`${i}-${stop}`} className={cn('relative flex items-start gap-3.5 text-15', last && 'font-bold')}>
              <span aria-hidden="true" className={cn('route-stop mt-0.5 size-5 shrink-0 rounded-full border-4 border-rust', last ? 'bg-rust' : 'bg-paper')} style={{ '--at': at(i) } as CSSProperties} />
              {!last && (
                <span aria-hidden="true" className="route-line absolute -bottom-3 left-2 top-[22px] w-1 bg-rust" style={{ '--from': at(i), '--to': at(i + 1) } as CSSProperties} />
              )}
              {stop}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
