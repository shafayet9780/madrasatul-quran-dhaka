'use client';

import { useMemo, useState } from 'react';
import { ChipRadioGroup, Icon, Progress, Topbar } from '@/components/survey/ui';
import { formatDateTime } from '@/lib/survey/dates';
import { batchLabel, bn, nameInitial, sectionDisplay } from '@/lib/survey/labels';
import type { OverviewItem } from '@/lib/survey/t1-types';
import { OfficeContact } from '../StatusScreens';
import { sizeKey, type T1Config } from './types';

const shortDate = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short' });

export function IntroScreen({ config, onStart }: { config: T1Config; onStart: () => void }) {
  const { template } = config.snapshot;
  return (
    <main className="sv-screen">
      <div className="flex items-center gap-3" style={{ padding: '28px 24px 0' }}>
        <div
          aria-hidden="true"
          className="sv-head flex items-center justify-center"
          style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--sv-tint)', boxShadow: 'inset 0 0 0 1.5px var(--sv-bronze)', color: 'var(--sv-bronze)', fontSize: 19 }}
        >
          ম
        </div>
        <div className="flex flex-col" style={{ lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>মাদরাসাতুল কুরআন, ঢাকা</span>
          <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>শিক্ষকের রিভিউ · {config.label}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3.5" style={{ padding: '40px 24px 0' }}>
        <div aria-hidden="true" style={{ width: 40, height: 2, background: 'var(--sv-bronze)' }} />
        <h1 className="sv-head sv-h1" style={{ fontSize: 30, lineHeight: 1.4 }}>
          {template.title}
        </h1>
        {template.intro && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: 'var(--sv-text-body)' }}>{template.intro}</p>}
      </div>
      <dl
        className="grid grid-cols-3"
        style={{ margin: '28px 24px 0', borderTop: '1px solid var(--sv-hairline)', borderBottom: '1px solid var(--sv-hairline)' }}
      >
        {[
          [bn(template.questions.length), 'প্রশ্ন'],
          ['~১০', 'মিনিট/ক্লাস'],
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
      <div className="flex flex-col gap-4" style={{ marginTop: 'auto', padding: '24px 24px calc(30px + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2.5" style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--sv-text-body)' }}>
          <span style={{ flex: 'none', marginTop: 3 }}>{Icon.cloud()}</span>
          <span>প্রতিটি মার্ক সাথে সাথে সংরক্ষিত হয়; যেকোনো সময় থেমে পরে আবার শুরু করতে পারবেন।</span>
        </div>
        <button type="button" className="sv-cta" onClick={onStart}>
          শুরু করুন {Icon.next()}
        </button>
      </div>
    </main>
  );
}

export function TeacherScreen({
  config,
  selected,
  onSelect,
  onBack,
  onNext,
  onMissing,
}: {
  config: T1Config;
  selected?: string;
  onSelect: (key: string) => void;
  onBack: () => void;
  onNext: () => void;
  onMissing: () => void;
}) {
  const [query, setQuery] = useState('');
  const teachers = useMemo(() => {
    const q = query.trim();
    return q ? config.snapshot.teachers.filter((t) => t.name.includes(q)) : config.snapshot.teachers;
  }, [config.snapshot.teachers, query]);

  return (
    <main className="sv-screen">
      <Progress total={2} done={(i) => i === 0} />
      <Topbar label="শুরু · ধাপ ১/২" onBack={onBack} />
      <div style={{ padding: '10px 20px 0' }}>
        <h1 className="sv-head sv-h1" style={{ lineHeight: 1.4 }}>
          আপনার নাম বাছাই করুন
        </h1>
      </div>
      <div style={{ padding: '14px 16px 6px' }}>
        <label htmlFor="teacher-search" className="sv-visually-hidden">
          শিক্ষকের নাম খুঁজুন
        </label>
        <div className="sv-search">
          {Icon.search()}
          <input id="teacher-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="নাম লিখে খুঁজুন" autoComplete="off" />
        </div>
      </div>
      <div className="flex flex-col gap-2" style={{ padding: '8px 16px 12px' }}>
        {teachers.map((t) => (
          <button key={t.key} type="button" className="sv-option" aria-pressed={selected === t.key} onClick={() => onSelect(t.key)}>
            <span className="sv-avatar" aria-hidden="true">
              {nameInitial(t.name)}
            </span>
            <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{t.name}</span>
            {selected === t.key && Icon.checkCircle()}
          </button>
        ))}
        {!teachers.length && (
          <p className="sv-muted" style={{ margin: '12px 4px', fontSize: 15 }}>
            “{query}” নামে কেউ নেই। বানান দেখে নিন, অথবা নিচের লিংকে চাপুন।
          </p>
        )}
      </div>
      <div className="sv-footer">
        <button type="button" className="sv-tertiary" onClick={onMissing}>
          আমার নাম তালিকায় নেই
        </button>
        <button type="button" className="sv-cta" disabled={!selected} onClick={onNext}>
          পরবর্তী ধাপ
        </button>
      </div>
    </main>
  );
}

export function MissingNameScreen({ config, onBack }: { config: T1Config; onBack: () => void }) {
  return (
    <main className="sv-screen">
      <Topbar label="শিক্ষকের নাম" onBack={onBack} />
      <div className="flex flex-col gap-4" style={{ padding: '24px 20px' }}>
        <div className="sv-card">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 21, lineHeight: 1.45 }}>
            আপনার নাম যোগ করতে অ্যাডমিনকে জানান
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--sv-text-muted)', lineHeight: 1.6 }}>
            অ্যাডমিন নাম যোগ করে তালিকা হালনাগাদ করলে এই একই লিংকে আপনার নাম দেখা যাবে।
          </p>
          <OfficeContact phone={config.officePhone} />
          <button type="button" className="sv-secondary" onClick={onBack}>
            তালিকায় ফিরে যান
          </button>
        </div>
      </div>
    </main>
  );
}

export function ClassScreen({
  config,
  teacherKey,
  overview,
  initial,
  onBack,
  onStart,
  busy,
  error,
}: {
  config: T1Config;
  teacherKey: string;
  overview: OverviewItem[] | null;
  initial: { classKey?: string; sectionKey?: string; subjectKey?: string };
  onBack: () => void;
  onStart: (key: { classKey: string; sectionKey: string; subjectKey: string }) => void;
  busy: boolean;
  error: string | null;
}) {
  const { snapshot } = config;
  const teacher = snapshot.teachers.find((t) => t.key === teacherKey);
  const [classKey, setClassKey] = useState(initial.classKey);
  const [sectionKey, setSectionKey] = useState(initial.sectionKey);
  const [subjectKey, setSubjectKey] = useState(initial.subjectKey);
  const cls = snapshot.classes.find((c) => c.key === classKey);
  const needsSection = Boolean(cls?.sections.length);
  const section = needsSection ? sectionKey : '';
  const placeChosen = cls && (!needsSection || cls.sections.some((s) => s.key === sectionKey));
  const subject = cls?.subjects.find((s) => s.key === subjectKey);
  const ready = Boolean(placeChosen && subject);

  const statusOf = (subject: string) =>
    overview?.find((o) => o.classKey === classKey && o.sectionKey === section && o.subjectKey === subject);
  const resume = overview?.find((o) => o.status === 'draft');
  const chosen = ready ? statusOf(subjectKey!) : undefined;
  const size = placeChosen ? config.classSizes[sizeKey(classKey!, section ?? '')] ?? 0 : 0;
  const ctaLabel = chosen?.status === 'submitted' ? 'জমা দেওয়া রিভিউ সংশোধন করুন' : chosen?.status === 'draft' ? 'খসড়া চালিয়ে যান' : 'শুরু করুন';

  return (
    <main className="sv-screen">
      <Progress total={2} done={() => true} />
      <Topbar label="শুরু · ধাপ ২/২" onBack={onBack} />
      <div className="flex flex-col gap-1" style={{ padding: '8px 20px 0' }}>
        <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>আসসালামু আলাইকুম,</div>
        <h1 className="sv-head" style={{ margin: 0, fontSize: 24, lineHeight: 1.4 }}>
          {teacher?.name}
        </h1>
      </div>

      {resume && (
        <div className="flex items-center gap-3" style={{ margin: '14px 16px 0', padding: '14px 16px', borderRadius: 16, background: 'var(--sv-stone)' }}>
          <span style={{ flex: 'none', color: '#7A4B2E' }}>{Icon.clock()}</span>
          <div className="flex flex-col gap-0.5" style={{ flex: 1, lineHeight: 1.45 }}>
            <div style={{ fontSize: 13, color: '#7A4B2E', fontWeight: 600 }}>অসমাপ্ত রিভিউ</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{batchLabel(snapshot, resume)}</div>
            <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
              {bn(resume.total)} জনের মধ্যে {bn(resume.done)} জন সম্পন্ন
            </div>
          </div>
          <button
            type="button"
            className="sv-tertiary"
            style={{ color: '#7A4B2E', textDecoration: 'none', fontSize: 15, padding: '12px 4px' }}
            onClick={() => onStart({ classKey: resume.classKey, sectionKey: resume.sectionKey, subjectKey: resume.subjectKey })}
          >
            চালিয়ে যান
          </button>
        </div>
      )}

      <div className="flex flex-col gap-5" style={{ padding: '20px 16px 16px' }}>
        <ChipRadioGroup
          label="শ্রেণি"
          columns={3}
          value={classKey}
          options={snapshot.classes.map((c) => ({ value: c.key, label: c.name }))}
          onChange={(value) => {
            setClassKey(value);
            setSectionKey(undefined);
            if (!snapshot.classes.find((c) => c.key === value)?.subjects.some((s) => s.key === subjectKey)) setSubjectKey(undefined);
          }}
        />
        {cls && needsSection && (
          <ChipRadioGroup
            label="শাখা"
            columns={2}
            value={sectionKey}
            options={cls.sections.map((s) => ({ value: s.key, label: sectionDisplay(s.name) }))}
            onChange={setSectionKey}
          />
        )}
        {cls && (
          <ChipRadioGroup
            label="বিষয়"
            columns={2}
            value={subjectKey}
            options={cls.subjects.map((s) => {
              const status = placeChosen ? statusOf(s.key) : undefined;
              return {
                value: s.key,
                label: s.name,
                note: status?.status === 'submitted' ? '✓ জমা দিয়েছেন' : status ? `◐ খসড়া ${bn(status.done)}/${bn(status.total)}` : undefined,
              };
            })}
            onChange={setSubjectKey}
          />
        )}
        {cls && !cls.subjects.length && <p className="sv-muted" style={{ margin: 0, fontSize: 15 }}>এই শ্রেণির বিষয় তালিকা এখনো যোগ করা হয়নি। অফিসে জানান।</p>}
      </div>

      <div className="sv-footer is-white">
        {error && (
          <div role="alert" className="sv-banner is-error" style={{ padding: '10px 14px', fontSize: 14.5 }}>
            {error}
          </div>
        )}
        <div className="flex justify-between items-baseline gap-2">
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {ready ? batchLabel(snapshot, { classKey: classKey!, sectionKey: section!, subjectKey: subjectKey! }) : 'শ্রেণি ও বিষয় বাছাই করুন'}
          </div>
          {placeChosen && <div style={{ fontSize: 14, color: 'var(--sv-text-muted)', whiteSpace: 'nowrap' }}>{bn(size)} জন</div>}
        </div>
        {ready && size === 0 && <div style={{ fontSize: 14, color: 'var(--sv-warn)' }}>এই শ্রেণিতে কোনো শিক্ষার্থী নেই। অফিসে জানান।</div>}
        <button
          type="button"
          className="sv-cta"
          disabled={!ready || size === 0 || busy}
          aria-busy={busy || undefined}
          onClick={() => onStart({ classKey: classKey!, sectionKey: section!, subjectKey: subjectKey! })}
        >
          {busy ? <>{Icon.spinner()} খুলছি…</> : ctaLabel}
        </button>
      </div>
    </main>
  );
}

export function closesText(closesAt: string) {
  return formatDateTime(new Date(closesAt));
}
