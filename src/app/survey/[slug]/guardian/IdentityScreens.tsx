'use client';

import { useRef, type KeyboardEvent } from 'react';
import { ChipRadioGroup, Icon, Progress, Topbar } from '@/components/survey/ui';
import type { MatchedChild } from '@/lib/survey/guardian-types';
import { bn, nameInitial, sectionDisplay } from '@/lib/survey/labels';
import { normaliseMobile } from '@/lib/survey/normalise';
import { OfficeContact } from '../StatusScreens';
import type { GuardianConfig, Identity, Relation } from './types';

const shortDate = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

const MINUTES: Record<GuardianConfig['kind'], string> = { G1: '৮–১২', G2: '৩–৫' };

export type LookupError = 'not-found' | 'rate-limited' | 'closed' | 'network' | 'failed';
export type VerifyState = 'idle' | 'checking' | 'verified' | 'unverified';

/** "নার্সারি · শাখা A", or the class alone. */
function placeLabel(config: GuardianConfig, classKey: string, sectionKey: string): string {
  const cls = config.snapshot.classes.find((c) => c.key === classKey);
  if (!cls) return '';
  const section = cls.sections.find((s) => s.key === sectionKey);
  return section ? `${cls.name} · ${sectionDisplay(section.name)}` : cls.name;
}

/** 8801915482736 → ০১৯১৫-৪৮২৭৩৬; a foreign number keeps its country code. */
function mobileEcho(normalised: string): string {
  if (!normalised.startsWith('8801')) return bn(`+${normalised}`);
  const local = normalised.slice(2);
  return `${bn(`${local.slice(0, 5)}-${local.slice(5)}`)} · ১১ সংখ্যা`;
}

function LockNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5" style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--sv-text-body)' }}>
      <svg style={{ flex: 'none', marginTop: 3 }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--sv-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function IntroScreen({ config, onStart }: { config: GuardianConfig; onStart: () => void }) {
  const { template } = config.snapshot;
  return (
    <main className="sv-screen">
      <div className="sv-mobile-only flex items-center gap-3" style={{ padding: '28px 24px 0' }}>
        <div
          aria-hidden="true"
          className="sv-head flex items-center justify-center"
          style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--sv-tint)', boxShadow: 'inset 0 0 0 1.5px var(--sv-bronze)', color: 'var(--sv-bronze)', fontSize: 19 }}
        >
          ম
        </div>
        <div className="flex flex-col" style={{ lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>মাদরাসাতুল কুরআন, ঢাকা</span>
          <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>অভিভাবক রিভিউ · {config.label}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3.5" style={{ padding: '40px 24px 0' }}>
        <div className="sv-desktop-only" style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
          অভিভাবক রিভিউ · {config.label}
        </div>
        <div aria-hidden="true" style={{ width: 40, height: 2, background: 'var(--sv-bronze)' }} />
        <h1 className="sv-head sv-h1" style={{ fontSize: 30, lineHeight: 1.4 }}>
          {template.title}
        </h1>
        {template.intro && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: 'var(--sv-text-body)' }}>{template.intro}</p>}
      </div>
      <dl className="grid grid-cols-3" style={{ margin: '28px 24px 0', borderTop: '1px solid var(--sv-hairline)', borderBottom: '1px solid var(--sv-hairline)' }}>
        {[
          [bn(template.questions.length), 'প্রশ্ন'],
          [MINUTES[config.kind], 'মিনিট'],
          [shortDate.format(new Date(config.closesAt)), 'শেষ সময়'],
        ].map(([value, label], i) => (
          <div key={label} className="flex flex-col-reverse gap-0.5" style={{ padding: i ? '14px 0 14px 16px' : '14px 0', borderLeft: i ? '1px solid var(--sv-hairline)' : undefined }}>
            <dt style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>{label}</dt>
            <dd className="sv-num" style={{ margin: 0, fontSize: 22 }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {config.kind === 'G1' && (
        <div className="flex flex-col gap-2.5" style={{ padding: '22px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sv-text-muted)', letterSpacing: 0.3 }}>মার্কিং</div>
          <div aria-hidden="true" className="sv-track is-large" style={{ ['--sv-marks' as string]: template.scale.length }}>
            {template.scale.map((mark, i) => (
              <span key={mark} className="sv-mark flex items-center justify-center" aria-checked={i === 0} style={{ height: 44, fontSize: 19 }}>
                {bn(mark)}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 14.5, color: 'var(--sv-text-muted)' }}>১০ = সবচেয়ে ভালো · ৪ = সন্তোষজনক নয়</div>
        </div>
      )}
      <div className="flex flex-col gap-4" style={{ marginTop: 'auto', padding: '24px 24px calc(30px + env(safe-area-inset-bottom))' }}>
        <LockNote>আপনার নাম ও উত্তর শুধু প্রিন্সিপাল ও অ্যাডমিন দেখবেন; শিক্ষক দেখবেন না।</LockNote>
        <button type="button" className="sv-cta" onClick={onStart}>
          শুরু করুন {Icon.next()}
        </button>
      </div>
    </main>
  );
}

export function ClassScreen({
  config,
  classKey,
  sectionKey,
  onClass,
  onSection,
  onBack,
  onNext,
}: {
  config: GuardianConfig;
  classKey?: string;
  sectionKey?: string;
  onClass: (key: string) => void;
  onSection: (key: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { classes } = config.snapshot;
  const cls = classes.find((c) => c.key === classKey);
  const ready = Boolean(cls && (!cls.sections.length || cls.sections.some((s) => s.key === sectionKey)));
  return (
    <main className="sv-screen">
      <Progress total={3} done={(i) => i < 1} current={1} />
      <Topbar label="পরিচয় · ১/৩" onBack={onBack} />
      <div style={{ padding: '10px 20px 0' }}>
        <h1 className="sv-head sv-h1" style={{ lineHeight: 1.4 }}>
          আপনার সন্তান কোন শ্রেণিতে পড়ে?
        </h1>
      </div>
      <div className="flex flex-col gap-5" style={{ padding: '18px 16px 12px' }}>
        <ChipRadioGroup
          label="শ্রেণি"
          columns={3}
          value={classKey}
          onChange={onClass}
          options={classes.map((c) => ({ value: c.key, label: c.name, note: c.sections.length ? `${bn(c.sections.length)} শাখা` : undefined }))}
        />
        {cls && cls.sections.length > 0 && (
          <ChipRadioGroup label="শাখা" columns={2} value={sectionKey} onChange={onSection} options={cls.sections.map((s) => ({ value: s.key, label: sectionDisplay(s.name) }))} />
        )}
      </div>
      <div className="sv-footer">
        <button type="button" className="sv-cta" disabled={!ready} onClick={onNext}>
          {ready ? `${placeLabel(config, classKey!, sectionKey ?? '')} · চালিয়ে যান` : 'শ্রেণি বাছাই করুন'}
          {ready && Icon.next()}
        </button>
      </div>
    </main>
  );
}

const LOOKUP_ERRORS: Record<Exclude<LookupError, 'not-found'>, string> = {
  'rate-limited': 'অনেকবার খোঁজা হয়েছে। কয়েক মিনিট পরে আবার চেষ্টা করুন।',
  closed: 'এই রিভিউ এখন বন্ধ।',
  network: 'ইন্টারনেট সংযোগ নেই। সংযোগ দেখে আবার চেষ্টা করুন।',
  failed: 'খোঁজা যায়নি। পাতাটি আবার লোড করে চেষ্টা করুন।',
};

export function IdentifyScreen({
  config,
  identity,
  value,
  busy,
  error,
  onBy,
  onValue,
  onBack,
  onChangeClass,
  onSearch,
}: {
  config: GuardianConfig;
  identity: Pick<Identity, 'classKey' | 'sectionKey' | 'by'>;
  value: string;
  busy: boolean;
  error: LookupError | null;
  onBy: (by: Identity['by']) => void;
  onValue: (value: string) => void;
  onBack: () => void;
  onChangeClass: () => void;
  onSearch: () => void;
}) {
  const place = placeLabel(config, identity.classKey, identity.sectionKey);
  const byMobile = identity.by === 'mobile';
  const mobile = byMobile ? normaliseMobile(value) : null;
  return (
    <main className="sv-screen">
      <Progress total={3} done={(i) => i < 2} current={2} />
      <Topbar label="পরিচয় · ২/৩" onBack={onBack} />
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim() && !busy) onSearch();
        }}
      >
        <div className="flex flex-col gap-2" style={{ padding: '6px 20px 0' }}>
          <div className="flex items-center gap-2" style={{ fontSize: 14.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--sv-bronze-text)' }}>{place}</span>
            <button type="button" className="sv-tertiary" style={{ padding: '8px 4px', fontSize: 14.5 }} onClick={onChangeClass}>
              পরিবর্তন
            </button>
          </div>
          <h1 className="sv-head sv-h1" style={{ lineHeight: 1.4 }}>
            শিক্ষার্থী খুঁজে বের করুন
          </h1>
        </div>
        <div className="flex flex-col gap-4" style={{ padding: '16px 16px 12px' }}>
          <ChipRadioGroup
            label="খোঁজার উপায়"
            columns={2}
            value={identity.by}
            onChange={onBy}
            options={[
              { value: 'mobile', label: 'মোবাইল নম্বর' },
              { value: 'id', label: 'শিক্ষার্থী আইডি' },
            ]}
          />
          <label className="sv-field">
            <span>{byMobile ? 'বাবা বা মায়ের মোবাইল নম্বর' : 'শিক্ষার্থী আইডি'}</span>
            <input
              value={value}
              onChange={(e) => onValue(e.target.value)}
              inputMode={byMobile ? 'tel' : 'numeric'}
              autoComplete={byMobile ? 'tel' : 'off'}
              maxLength={24}
              aria-invalid={error === 'not-found' || undefined}
              aria-describedby={error ? 'lookup-help lookup-error' : 'lookup-help'}
              style={{ fontSize: 19, letterSpacing: 0.5 }}
            />
          </label>
          <div id="lookup-help" className="flex flex-col gap-1.5" style={{ padding: '0 4px', fontSize: 14, lineHeight: 1.55, color: 'var(--sv-text-muted)' }}>
            {mobile && (
              <span className="flex items-center gap-1.5" style={{ color: 'var(--sv-ok)', fontWeight: 600 }}>
                {Icon.check()} {mobileEcho(mobile)}
              </span>
            )}
            <span>
              {byMobile
                ? 'স্কুলে যে নম্বর দেওয়া আছে সেটি দিন। বাংলা বা ইংরেজি, যেকোনো সংখ্যায় লিখতে পারেন। বিদেশি নম্বর দেশের কোডসহ (+৪৪…) লিখুন।'
                : 'স্কুল থেকে দেওয়া শিক্ষার্থী আইডি, যেমন ১০০১৪।'}
            </span>
          </div>
          <div aria-live="polite">
            {error === 'not-found' && (
              <div id="lookup-error" className="sv-card" style={{ borderColor: 'var(--sv-tint-border)', background: 'var(--sv-warn-bg)', gap: 12 }}>
                <div className="flex gap-2.5">
                  <svg style={{ flex: 'none', marginTop: 2 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sv-warn)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5M8.5 11h5" />
                  </svg>
                  <div className="flex flex-col gap-1">
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--sv-warn)' }}>
                      {place}-তে এই {byMobile ? 'নম্বরের' : 'আইডির'} কোনো শিক্ষার্থী পাওয়া যায়নি
                    </div>
                    <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--sv-text-body)' }}>
                      শ্রেণি ঠিক আছে কি না দেখুন, অথবা {byMobile ? 'শিক্ষার্থী আইডি' : 'মোবাইল নম্বর'} দিয়ে চেষ্টা করুন।{byMobile ? ' স্কুলে হয়তো অন্য নম্বর দেওয়া আছে।' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" className="sv-secondary" onClick={onChangeClass}>
                    শ্রেণি বদলান
                  </button>
                  <button type="button" className="sv-secondary" onClick={() => onBy(byMobile ? 'id' : 'mobile')}>
                    {byMobile ? 'আইডি দিয়ে খুঁজুন' : 'মোবাইল দিয়ে খুঁজুন'}
                  </button>
                </div>
                <OfficeContact phone={config.officePhone} prefix="সাহায্য দরকার? অফিসে যোগাযোগ করুন" />
              </div>
            )}
            {error && error !== 'not-found' && (
              <p id="lookup-error" role="alert" style={{ margin: 0, padding: '0 4px', fontSize: 15, color: 'var(--sv-warn)' }}>
                {LOOKUP_ERRORS[error]}
              </p>
            )}
          </div>
          <LockNote>শুধু এই শ্রেণির শিক্ষার্থীর নাম দেখানো হবে। আপনার তথ্য শুধু স্কুল কর্তৃপক্ষ দেখবেন।</LockNote>
        </div>
        <div className="sv-footer">
          <button type="submit" className="sv-cta" disabled={!value.trim() || busy} aria-busy={busy || undefined}>
            {busy ? 'খোঁজা হচ্ছে…' : 'খুঁজুন'}
          </button>
        </div>
      </form>
    </main>
  );
}

function ChildRadios({ kids, value, onChange }: { kids: MatchedChild[]; value?: string; onChange: (erpId: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = kids.findIndex((c) => c.erpId === value);
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + kids.length) % kids.length;
    onChange(kids[next].erpId);
    refs.current[next]?.focus();
  }
  return (
    <div role="radiogroup" aria-labelledby="match-title" className="flex flex-col gap-2">
      {kids.map((child, i) => (
        <button
          key={child.erpId}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={child.erpId === value}
          tabIndex={selected === -1 ? (i === 0 ? 0 : -1) : i === selected ? 0 : -1}
          className="sv-option"
          onClick={() => onChange(child.erpId)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          <span className="sv-avatar" aria-hidden="true">
            {nameInitial(child.name)}
          </span>
          <span className="flex flex-col" style={{ flex: 1, lineHeight: 1.45 }}>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{child.name}</span>
            <span style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
              {child.roll !== null ? `রোল ${bn(child.roll)} · ` : ''}আইডি {bn(child.erpId)}
            </span>
          </span>
          {child.erpId === value && Icon.checkCircle()}
        </button>
      ))}
    </div>
  );
}

const RELATIONS: { value: Relation; label: string }[] = [
  { value: 'father', label: 'পিতা' },
  { value: 'mother', label: 'মাতা' },
  { value: 'other', label: 'অন্যান্য' },
];

export function MatchScreen({
  config,
  identity,
  verify,
  onChange,
  onSearchAgain,
  onStart,
}: {
  config: GuardianConfig;
  identity: Identity;
  verify: VerifyState;
  onChange: (patch: Partial<Identity>) => void;
  onSearchAgain: () => void;
  onStart: () => void;
}) {
  const { children } = identity;
  const child = children.find((c) => c.erpId === identity.childErpId);
  const several = children.length > 1;
  const mobileOk = Boolean(normaliseMobile(identity.mobile));
  const relationOk = identity.relation && (identity.relation !== 'other' || identity.relationOther.trim());
  const ready = Boolean(child && identity.name.trim() && relationOk && mobileOk);
  return (
    <main className="sv-screen">
      <Progress total={3} done={() => true} />
      <Topbar label="পরিচয় · ৩/৩" onBack={onSearchAgain} />
      <div className="flex flex-col gap-1.5" style={{ padding: '10px 20px 0' }}>
        <h1 id="match-title" className="sv-head sv-h1" style={{ lineHeight: 1.4 }}>
          {several ? 'কার জন্য রিভিউ দিচ্ছেন?' : 'এটি কি আপনার সন্তান?'}
        </h1>
        {several && (
          <div style={{ fontSize: 15, color: 'var(--sv-text-muted)' }}>
            এই নম্বরের সাথে {placeLabel(config, identity.classKey, identity.sectionKey)}-তে {bn(children.length)} জন শিক্ষার্থী আছে
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2" style={{ padding: '16px 16px 0' }}>
        <ChildRadios kids={children} value={identity.childErpId} onChange={(childErpId) => onChange({ childErpId })} />
        {several ? (
          <div style={{ padding: '2px 4px', fontSize: 14, color: 'var(--sv-text-muted)' }}>জমা দেওয়ার পর অন্যজনের জন্য আলাদা রিভিউ দিতে পারবেন।</div>
        ) : (
          <button type="button" className="sv-tertiary" style={{ alignSelf: 'flex-start', padding: '8px 4px' }} onClick={onSearchAgain}>
            না, আবার খুঁজুন
          </button>
        )}
        {child?.submittedAt && (
          <div role="note" className="flex gap-3" style={{ marginTop: 4, padding: '14px 16px', borderRadius: 16, background: 'var(--sv-warn-bg)' }}>
            <svg style={{ flex: 'none', marginTop: 2 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sv-warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <div className="flex flex-col gap-1">
              <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--sv-warn)' }}>এই শিক্ষার্থীর রিভিউ আগেই জমা হয়েছে</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.55, color: '#6b3a14' }}>
                {longDate.format(new Date(child.submittedAt))} একটি রিভিউ জমা হয়েছে। নতুন রিভিউ জমা দিলে আগেরটির বদলে এটি গণ্য হবে।
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3" style={{ padding: '22px 16px 12px' }}>
        <h2 className="sv-head" style={{ margin: 0, fontSize: 20, lineHeight: 1.4, paddingLeft: 4 }}>
          আপনার পরিচয়
        </h2>
        <label className="sv-field">
          <span>আপনার নাম</span>
          <input value={identity.name} onChange={(e) => onChange({ name: e.target.value })} autoComplete="name" maxLength={80} />
        </label>
        <ChipRadioGroup label="শিক্ষার্থীর সাথে সম্পর্ক" columns={3} value={identity.relation} onChange={(relation) => onChange({ relation })} options={RELATIONS} />
        {identity.relation === 'other' && (
          <label className="sv-field">
            <span>সম্পর্ক লিখুন (যেমন চাচা, মামা)</span>
            <input value={identity.relationOther} onChange={(e) => onChange({ relationOther: e.target.value })} maxLength={40} />
          </label>
        )}
        <label className="sv-field">
          <span>আপনার মোবাইল নম্বর</span>
          <input
            value={identity.mobile}
            onChange={(e) => onChange({ mobile: e.target.value })}
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            aria-describedby="verify-state"
            className="sv-num"
            style={{ fontSize: 19 }}
          />
        </label>
        <div id="verify-state" aria-live="polite" style={{ padding: '0 4px', fontSize: 14.5, lineHeight: 1.55 }}>
          {verify === 'verified' && (
            <span className="flex items-center gap-2" style={{ color: 'var(--sv-ok)', fontWeight: 600 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              যাচাইকৃত · স্কুলের রেকর্ডের সাথে মিলেছে
            </span>
          )}
          {verify === 'unverified' && (
            <span className="flex gap-2" style={{ color: 'var(--sv-text-body)' }}>
              <svg style={{ flex: 'none', marginTop: 3 }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--sv-warn)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8h.01M11 12h1v5h1" />
              </svg>
              <span>
                এই নম্বর স্কুলের রেকর্ডে নেই। আপনার রিভিউ গ্রহণ হবে, তবে <b>অযাচাইকৃত</b> হিসেবে চিহ্নিত থাকবে। নম্বর হালনাগাদ করতে অফিসে জানান।
              </span>
            </span>
          )}
          {verify === 'idle' && identity.mobile.trim() && !mobileOk && <span style={{ color: 'var(--sv-text-muted)' }}>সঠিক মোবাইল নম্বর দিন।</span>}
        </div>
      </div>

      <div className="sv-footer">
        <button type="button" className="sv-cta" disabled={!ready} onClick={onStart}>
          {child?.submittedAt ? 'নতুন রিভিউ শুরু করুন' : 'প্রশ্ন শুরু করুন'} {Icon.next()}
        </button>
      </div>
    </main>
  );
}
