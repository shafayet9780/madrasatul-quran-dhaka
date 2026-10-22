import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { Icon, type IconName } from '@/components/site/icon';
import { cn } from '@/lib/utils';
import { homePhoto } from '@/lib/home/photos';
import type { FixedPhoto, HomePage } from '@/types/home';

// The reasons to choose the school (home.why.reasons) as cards: all eight on the homepage (Why), four on the Admissions page.

const LOOK = {
  light: { card: 'bg-paper text-ink', sub: 'text-ink-body', accent: 'text-rust' },
  // A light card on a paper ground (the Admissions page).
  surface: { card: 'border border-line bg-surface text-ink', sub: 'text-ink-body', accent: 'text-rust' },
  // A dark card on a dark ground (the Admissions page).
  panel: { card: 'bg-panel text-on-dark shadow-[inset_0_0_0_1px_var(--color-line-dark)]', sub: 'text-on-dark-body', accent: 'text-bronze' },
  sand: { card: 'bg-sand text-ink', sub: 'text-ink-body', accent: 'text-rust-deep' },
  dark: { card: 'bg-dark text-on-dark', sub: 'text-on-dark-body', accent: 'text-bronze' },
};

/** Each reason's card, in the order of home.why.reasons: a photo (Studio → Homepage → Section photos), an icon or a goal figure (the figure is in the copy). */
const REASONS: { look: keyof typeof LOOK; photo?: FixedPhoto; icon?: IconName; goal?: boolean }[] = [
  { look: 'light', photo: 'whyBooks' },
  { look: 'sand', icon: 'translate' },
  { look: 'dark', goal: true },
  { look: 'light', icon: 'book-open-text' },
  { look: 'light', icon: 'signpost' },
  { look: 'dark', goal: true },
  { look: 'sand', icon: 'scroll' },
  { look: 'light', photo: 'whyTeachers' },
];

type Reason = { title: string; text: string; figure?: string; alt?: string };

/**
 * The reasons as cards, in an auto-fill grid (four across on wide screens, two on phones). `only` picks some by their
 * place in home.why.reasons. On a `paper` ground the light cards turn `surface` with a border, and on a `dark` ground
 * the dark cards turn `panel`, so every card still shows.
 */
export async function ReasonCards({ locale, home, only, ground = 'cream' }: { locale: Locale; home: HomePage | null; only?: number[]; ground?: 'cream' | 'paper' | 'dark' }) {
  const t = await getTranslations({ locale, namespace: 'home.why' });
  const reasons = t.raw('reasons') as Reason[];
  const shown = REASONS.map((r, i) => ({ ...r, i })).filter(({ i }) => !only || only.includes(i));
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(max(150px,calc(25%-18px)),1fr))] gap-3.5 p-0">
      {shown.map(({ look, photo, icon, goal, i }) => {
        const r = reasons[i];
        const image = photo && homePhoto(home, photo, locale, 600, r.alt ?? '');
        const l = LOOK[look === 'light' && ground === 'paper' ? 'surface' : look === 'dark' && ground === 'dark' ? 'panel' : look];
        return (
          <li key={r.title} className={cn('flex flex-col overflow-hidden rounded-card', l.card)}>
            {image && (
              <div className="relative aspect-[16/10]">
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1240px) 300px, (min-width: 700px) 25vw, 50vw" className="object-cover" style={{ objectPosition: image.position }} />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1.5 p-[clamp(14px,1.6vw,20px)]">
              {icon && <Icon name={icon} size={48} className={cn('mb-4', l.accent)} />}
              {r.figure && <span className={cn('mb-4 text-figure-md', l.accent)}>{r.figure}</span>}
              <div className="mt-auto flex flex-col gap-1.5">
                <h3 className="m-0 flex flex-wrap items-center gap-2 text-18 leading-[1.3] font-bold">
                  {r.title}
                  {goal && <span className="rounded-chip bg-sand-deep px-[7px] py-px text-12 font-strong text-dark">{t('goalTag')}</span>}
                </h3>
                <p className={cn('m-0 text-15 leading-[1.55]', l.sub)}>{r.text}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
