'use client';

import { useState, type ReactNode } from 'react';
import { CarFront, Footprints, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { num, type Locale } from '@/lib/admissions/display';
import { directionsUrl } from '@/lib/contact/directions';

export type RouteCopy = {
  label: string;
  tabs: { label: string; walk: string; drive: string };
  walk: { title: string; steps: string[] };
  drive: { title: string; from: string; steps: string[] }[];
  directions: string;
  hint: { walk: string; drive: string };
  map: {
    station: string;
    stationSub: string;
    sector: string;
    lake: string;
    mainRoad: string;
    avenue1: string;
    avenue7: string;
    road8: string;
    road11: string;
    waterPark: [string, string];
    bali: string;
    mosque: string;
    school: string;
    north: string;
    toNorth: string;
    toEast: string;
    toWest: [string, string];
    toSouth: string;
  };
};

type Mode = 'walk' | 'drive';

const DRIVE_COLOURS = ['var(--color-bronze)', 'var(--color-bronze-light)'];

/**
 * How to get here, on `panel`: a map drawn from Google Maps of sector 17 (the metro, the roads, the lake and the
 * landmarks people know), with the walk from Uttara Center station or the two ways in by car, the steps for the one
 * chosen, and Google's directions to the school's pin. `children` (a heading, the address) go above the switch.
 */
export function RouteMap({ copy, locale, logo, children, actions }: { copy: RouteCopy; locale: Locale; logo: string | null; children?: ReactNode; actions?: ReactNode }) {
  const [mode, setMode] = useState<Mode>('walk');
  const tab = (m: Mode, text: string, icon: ReactNode) => (
    <button
      type="button"
      role="tab"
      id={`route-tab-${m}`}
      aria-selected={mode === m}
      aria-controls={`route-steps-${m}`}
      onClick={() => setMode(m)}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full px-[18px] text-16 font-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light',
        mode === m ? 'bg-cream text-dark' : 'text-on-dark-muted hover:text-on-dark',
      )}
    >
      {icon}
      {text}
    </button>
  );
  return (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-7">
      <div className="min-w-0 max-w-[560px] flex-[1_1_320px]">
        <MapDrawing copy={copy} locale={locale} logo={logo} mode={mode} />
      </div>
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
        {children}
        <div role="tablist" aria-label={copy.tabs.label} className="flex gap-1.5 self-start rounded-full bg-dark p-[5px]">
          {tab('walk', copy.tabs.walk, <Footprints size={18} aria-hidden />)}
          {tab('drive', copy.tabs.drive, <CarFront size={18} aria-hidden />)}
        </div>
        <div id="route-steps-walk" role="tabpanel" aria-labelledby="route-tab-walk" hidden={mode !== 'walk'} className="flex flex-col gap-2.5">
          <Steps locale={locale} title={copy.walk.title} steps={copy.walk.steps} swatch={
              <span className="grid size-[26px] place-items-center rounded-full bg-map-walk text-dark">
                <Footprints size={15} strokeWidth={2.4} />
              </span>
            } />
        </div>
        <div id="route-steps-drive" role="tabpanel" aria-labelledby="route-tab-drive" hidden={mode !== 'drive'} className="flex flex-col gap-5">
          {copy.drive.map((d, i) => (
            <Steps
              key={d.title}
              locale={locale}
              title={d.title}
              from={d.from}
              steps={d.steps}
              swatch={
                <span className="grid size-[26px] place-items-center rounded-full text-14 font-heading text-dark" style={{ background: DRIVE_COLOURS[i] }}>
                  {num(i + 1, locale)}
                </span>
              }
            />
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-2.5">
          <a
            href={directionsUrl(mode === 'walk' ? 'walking' : 'driving')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cream px-[22px] text-16 font-strong text-dark no-underline hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light"
          >
            <Navigation size={18} aria-hidden />
            {copy.directions}
          </a>
          {actions}
        </div>
        <p className="m-0 text-14 text-on-dark-muted">{mode === 'walk' ? copy.hint.walk : copy.hint.drive}</p>
      </div>
    </div>
  );
}

function Steps({ locale, title, from, steps, swatch }: { locale: Locale; title: string; from?: string; steps: string[]; swatch: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-17 font-strong text-on-dark">
        <span className="flex w-[26px] justify-center" aria-hidden="true">
          {swatch}
        </span>
        {title}
        {from && <span className="text-15 font-normal text-on-dark-muted">{from}</span>}
      </h4>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {steps.map((s, i) => (
          <li key={s} className="grid grid-cols-[26px_1fr] gap-2.5 text-16 text-on-dark-body">
            <b className="text-center font-strong text-bronze-light">{num(i + 1, locale)}</b>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Label sizes in map units: larger on phones, where the map is drawn small (Tailwind needs the classes written out). */
const FS = {
  32: 'text-[44px] min-[480px]:text-[32px]',
  34: 'text-[46px] min-[480px]:text-[34px]',
  36: 'text-[48px] min-[480px]:text-[36px]',
  38: 'text-[52px] min-[480px]:text-[38px]',
  40: 'text-[54px] min-[480px]:text-[40px]',
  42: 'text-[56px] min-[480px]:text-[42px]',
} as const;

const lbl = { paintOrder: 'stroke', stroke: 'var(--color-panel)', strokeWidth: 9, strokeLinejoin: 'round' } as const;

/**
 * Traced from Google Maps (sector 17, Uttara): the main road with the metro, Avenue 1 and 7, Road 8 and 11, the lane
 * to the gate (it faces east) and the lake; not every street, only the ones the routes use. The route not chosen fades.
 */
function MapDrawing({ copy, locale, logo, mode }: { copy: RouteCopy; locale: Locale; logo: string | null; mode: Mode }) {
  const m = copy.map;
  const fade = (on: boolean) => ({ opacity: on ? 1 : 0, transition: 'opacity .2s' });
  return (
    <svg role="img" aria-label={copy.label} viewBox="0 -430 1300 1330" className="block h-auto w-full font-sans">
      <path
        d="M1268 -430 C1235 -300 1150 -150 1040 -40 C990 20 975 200 950 420 C935 600 915 760 905 900 L1060 900 C1075 760 1090 600 1110 420 C1130 230 1150 60 1200 -20 C1260 -120 1300 -260 1300 -300 L1300 -430 Z"
        fill="var(--color-map-water)"
      />
      <text x="1035" y="560" textAnchor="middle" className={FS[34]} fill="var(--color-on-dark-muted)" transform="rotate(-84 1035 560)" style={lbl}>
        {m.lake}
      </text>
      <text x="560" y="40" textAnchor="middle" fontSize="64" fontWeight="750" fill="var(--color-line-dark)">
        {m.sector}
      </text>
      <g fill="none" stroke="var(--color-map-road)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16">
        <path d="M840 -290 L817 -192 L762 180 L700 757" />
        <path d="M287 183 L622 226 L755 244" />
        <path d="M200 240 L278 247 L614 293 L749 306" />
        <path d="M292 150 L213 690" />
        <path d="M627 205 L570 590" />
      </g>
      <g fill="none" stroke="var(--color-map-road-major)" strokeLinecap="round" strokeWidth="24">
        <path d="M269 -373 L1300 -223" />
        <path d="M118 672 L1300 836" />
      </g>
      <path d="M276 -430 L86 900" stroke="var(--color-map-road-major)" strokeWidth="34" />
      <path d="M298 -430 L108 900" stroke="var(--color-rust)" strokeWidth="7" strokeDasharray="26 10" />
      <circle cx="269" cy="-373" r="24" fill="var(--color-panel)" stroke="var(--color-map-road-major)" strokeWidth="12" />
      <g fill="var(--color-on-dark-muted)" className={FS[38]} style={lbl}>
        <text x="140" y="600" transform="rotate(-81.6 140 600)">{m.mainRoad}</text>
        <text x="560" y="-312" transform="rotate(8.3 560 -312)">{m.avenue1}</text>
        <text x="790" y="815" transform="rotate(7.8 790 815)">{m.avenue7}</text>
        <text x="400" y="190" transform="rotate(7.3 400 190)">{m.road11}</text>
        <text x="815" y="-40" transform="rotate(-81.6 815 -40)">{m.road8}</text>
      </g>

      <g style={fade(mode === 'drive')}>
        <path d="M252 -200 L266 -340 Q272 -385 310 -367 L840 -290 L817 -192 L762 180 L755 244 L622 226 L615 262" fill="none" stroke={DRIVE_COLOURS[0]} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M232 -140 L124 655 Q122 680 150 682 L700 757 L749 306 L614 293 L606 284" fill="none" stroke={DRIVE_COLOURS[1]} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        {[
          [560, -262],
          [420, 755],
        ].map(([cx, cy], i) => (
          <g key={cx}>
            <circle cx={cx} cy={cy} r="24" fill={DRIVE_COLOURS[i]} />
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize="26" fontWeight="750" fill="var(--color-dark)">
              {num(i + 1, locale)}
            </text>
          </g>
        ))}
      </g>
      <path
        style={fade(mode === 'walk')}
        d="M264 -150 L207 228 L278 247 L287 183 L622 226 L616 262"
        fill="none"
        stroke="var(--color-map-walk)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 17"
      />

      <g fill="var(--color-on-dark-body)" className={FS[36]} fontWeight="650" style={lbl}>
        <text x="300" y="-398">↑ {m.toNorth}</text>
        <text x="1290" y="-300" textAnchor="end">
          {m.toEast} →
        </text>
        <text x="14" y="120">← {m.toWest[0]}</text>
        <text x="14" y="164" fontWeight="400" fill="var(--color-on-dark-muted)">
          {m.toWest[1]}
        </text>
        <text x="140" y="884">↓ {m.toSouth}</text>
      </g>

      <rect x="214" y="-208" width="52" height="52" rx="12" fill="var(--color-cream)" stroke="var(--color-rust)" strokeWidth="6" />
      <text x="240" y="-172" textAnchor="middle" fontSize="28" fontWeight="750" fill="var(--color-rust)">
        M
      </text>
      <text x="290" y="-190" fill="var(--color-on-dark)" className={FS[40]} fontWeight="750" style={lbl}>
        {m.station}
      </text>
      <text x="290" y="-140" fill="var(--color-on-dark-muted)" className={FS[32]} style={lbl}>
        {m.stationSub}
      </text>

      <circle cx="282" cy="268" r="13" fill="var(--color-map-walk)" />
      <g fill="var(--color-on-dark)" className={FS[38]} fontWeight="650" style={lbl}>
        <text x="232" y="440">{m.waterPark[0]}</text>
        <text x="232" y="492">{m.waterPark[1]}</text>
      </g>
      <circle cx="590" cy="727" r="13" fill="var(--color-bronze-light)" />
      <text x="660" y="680" textAnchor="end" fill="var(--color-on-dark)" className={FS[38]} fontWeight="650" style={lbl}>
        {m.bali}
      </text>
      <circle cx="726" cy="190" r="11" fill="var(--color-on-dark-faint)" />
      <text x="712" y="150" textAnchor="end" fill="var(--color-on-dark-body)" className={FS[34]} style={lbl}>
        {m.mosque}
      </text>

      <defs>
        <clipPath id="route-map-logo">
          <circle cx="570" cy="257" r="30" />
        </clipPath>
      </defs>
      <circle cx="570" cy="257" r="34" fill="var(--color-cream)" stroke="var(--color-rust)" strokeWidth="4" />
      {logo ? (
        <image href={logo} x="540" y="227" width="60" height="60" clipPath="url(#route-map-logo)" />
      ) : (
        <circle cx="570" cy="257" r="14" fill="var(--color-rust)" />
      )}
      <text x="570" y="346" textAnchor="middle" fill="var(--color-on-dark)" className={FS[42]} fontWeight="750" style={lbl}>
        {m.school}
      </text>

      <g transform="translate(1240 830)">
        <circle r="36" fill="var(--color-dark)" />
        <path d="M0 -26 L11 7 L0 0 L-11 7 Z" fill="var(--color-cream)" />
        <text y="26" textAnchor="middle" fontSize="18" fill="var(--color-on-dark-muted)">
          {m.north}
        </text>
      </g>
    </svg>
  );
}
