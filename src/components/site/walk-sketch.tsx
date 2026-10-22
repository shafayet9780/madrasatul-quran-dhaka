import { cn } from '@/lib/utils';

/** The sketch's labels: the station and the distance from School details, the rest from messages (home.campus.sketch). */
export function sketchCopy(raw: { alt: string; school: string; notToScale: string }, metro: { station: string; walk: string }) {
  return { ...raw, ...metro, alt: raw.alt.replace('{station}', metro.station).replace('{walk}', metro.walk) };
}

/** Not to scale: the metro station, the walk east and the school. Labels are set larger on phones, where the sketch is drawn small. */
export function WalkSketch({ c }: { c: { alt: string; station: string; walk: string; school: string; notToScale: string } }) {
  const label = 'fill-on-dark font-bold';
  return (
    <svg role="img" aria-label={c.alt} viewBox="0 0 420 230" className="block w-full overflow-visible">
      <path d="M0 57 H420 M0 115 H420 M0 173 H420 M105 0 V230 M210 0 V230 M315 0 V230" stroke="var(--color-line-dark)" strokeWidth={1} />
      <path d="M70 0 V230" stroke="var(--color-rust)" strokeWidth={10} strokeLinecap="round" />
      <circle cx={70} cy={115} r={14} fill="var(--color-cream)" stroke="var(--color-rust)" strokeWidth={7} />
      <path d="M92 115 H220 Q236 115 236 99 V86 Q236 72 252 72 H316" stroke="var(--color-bronze)" strokeWidth={3} strokeDasharray="7 6" fill="none" />
      <rect x={320} y={48} width={56} height={48} rx={6} fill="var(--color-rust)" />
      <text x={70} y={152} textAnchor="middle" className={cn(label, 'text-[19px] min-[480px]:text-[14px]')}>
        {c.station}
      </text>
      <text x={156} y={104} textAnchor="middle" className={cn(label, 'text-[19px] min-[480px]:text-[15px]')}>
        {c.walk}
      </text>
      <text x={348} y={122} textAnchor="middle" className={cn(label, 'text-[17px] min-[480px]:text-[13px]')}>
        {c.school}
      </text>
      <text x={410} y={220} textAnchor="end" className="fill-on-dark-faint text-[15px] min-[480px]:text-[11px]">
        {c.notToScale}
      </text>
    </svg>
  );
}
