'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import type { RoutineSummary } from '@/lib/routine/data';
import { periodTime, timeInput } from '@/lib/routine/days';
import type { Group, Period, Room, RoutineInfo, Subject } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { Card } from '../../ui';
import {
  activateRoutineAction,
  createRoutineAction,
  deleteGroupAction,
  deletePeriodAction,
  deleteRoomAction,
  deleteRoutineAction,
  deleteSubjectAction,
  renameRoutineAction,
  saveGroupAction,
  savePeriodAction,
  saveRoomAction,
  saveSubjectAction,
} from '../actions';
import { ConfirmButton, INPUT, OUTLINE, SELECT, useAction, useParam } from '../controls';

type Props = { routines: RoutineSummary[]; routine: RoutineInfo | null; periods: Period[]; subjects: Subject[]; rooms: Room[]; groups: Group[] };

export function SetupBoard({ routines, routine, periods, subjects, rooms, groups }: Props) {
  // Closing or reloading with an unsaved row asks first (the browser's own prompt).
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (unsaved.size) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <Routines routines={routines} current={routine} />
      {routine && <Periods routine={routine} periods={periods} />}
      <Groups groups={groups} rooms={rooms} />
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <Subjects subjects={subjects} />
        <Rooms rooms={rooms} />
      </div>
    </div>
  );
}

/** Rows with unsaved edits, so leaving the page can ask first. */
const unsaved = new Set<string>();

/** Local copy of a row that resets when the saved row changes. */
function useDraft<T>(saved: T) {
  const [draft, setDraft] = useState(saved);
  const key = JSON.stringify(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the saved values change
  useEffect(() => setDraft(saved), [key]);
  const dirty = JSON.stringify(draft) !== key;
  const row = useId();
  useEffect(() => {
    if (dirty) unsaved.add(row);
    else unsaved.delete(row);
    return () => void unsaved.delete(row);
  }, [dirty, row]);
  return { draft, set: (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch })), dirty, reset: () => setDraft(saved) };
}

const TH = 'px-2 py-2 text-left text-[12.5px] font-medium text-muted-foreground';
const TD = 'px-2 py-1.5 align-middle';
// A row with unsaved edits is tinted and its save button filled; its buttons stay in view when a
// wide table scrolls sideways on a phone.
const ROW = 'border-b bg-white last:border-0';
const ROW_DIRTY = 'bg-amber-50';
const ACTIONS = 'sticky right-0 whitespace-nowrap bg-inherit text-right';

// ── Routines ──

function Routines({ routines, current }: { routines: RoutineSummary[]; current: RoutineInfo | null }) {
  const set = useParam();
  const { pending, run, line } = useAction();
  const [name, setName] = useState('');
  const [copyFrom, setCopyFrom] = useState(current?.id ?? '');
  return (
    <Card title="রুটিন">
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">
        একবারে একটা রুটিন চালু থাকে; ফ্রি টিচার, প্রক্সি আর ওয়ার্কলোড সেটা দেখেই হিসাব হয়। নতুন বছরের রুটিন বানাতে চালু রুটিনটা কপি করুন, ড্রাফটে ঠিকঠাক করুন, তারপর চালু করুন।
      </p>
      {routines.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b">
                <th className={TH}>নাম</th>
                <th className={TH}>স্ট্যাটাস</th>
                <th className={TH}>পিরিয়ড</th>
                <th className={TH}>ক্লাস</th>
                <th className={cn(TH, 'sticky right-0 bg-white')} />
              </tr>
            </thead>
            <tbody>
              {routines.map((r) => (
                <RoutineRow key={r.id} routine={r} selected={r.id === current?.id} onSelect={() => set('r', r.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => createRoutineAction(name, copyFrom || null),
            (r) => {
              setName('');
              if (r.id) set('r', r.id);
            },
          );
        }}
      >
        <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          নতুন রুটিনের নাম
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন ২০২৮" maxLength={120} required />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          শুরু
          <select className={SELECT} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="">নতুন খালি রুটিন</option>
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} কপি করে
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="h-9" disabled={pending || !name.trim()}>
          রুটিন বানান
        </Button>
      </form>
      <div className="mt-2">{line}</div>
    </Card>
  );
}

function RoutineRow({ routine, selected, onSelect }: { routine: RoutineSummary; selected: boolean; onSelect: () => void }) {
  const { pending, run, line } = useAction();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(routine.name);
  const active = routine.status === 'active';
  return (
    <tr className={cn('border-b last:border-0', selected && 'bg-muted/50')}>
      <td className={TD}>
        {renaming ? (
          <form
            className="flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => renameRoutineAction(routine.id, name), () => setRenaming(false));
            }}
          >
            <input className={cn(INPUT, 'h-8 w-36')} value={name} onChange={(e) => setName(e.target.value)} aria-label="রুটিনের নাম" maxLength={120} />
            <Button type="submit" className="h-8" disabled={pending}>
              সেভ
            </Button>
          </form>
        ) : (
          <button type="button" className="font-medium underline-offset-4 hover:underline" onClick={onSelect} aria-pressed={selected}>
            {routine.name}
          </button>
        )}
        {line}
      </td>
      <td className={cn(TD, active ? 'text-success' : 'text-muted-foreground')}>{active ? 'চালু' : 'ড্রাফট'}</td>
      <td className={TD}>{bn(routine.periods)}</td>
      <td className={TD}>{bn(routine.assignments)}</td>
      <td className={cn(TD, 'text-right')}>
        <span className="inline-flex flex-wrap items-center justify-end gap-3">
          <Link href={`/admin/routine?r=${routine.id}`} className="text-[13px] underline-offset-4 hover:underline">
            রুটিন দেখুন
          </Link>
          {!renaming && (
            <button type="button" className="text-[13px] underline-offset-4 hover:underline" onClick={() => setRenaming(true)}>
              নাম বদলান
            </button>
          )}
          {!active && (
            <ConfirmButton className="text-foreground" confirm="হ্যাঁ, চালু করুন" disabled={pending} onConfirm={() => run(() => activateRoutineAction(routine.id))}>
              চালু করুন
            </ConfirmButton>
          )}
          {!active && (
            <ConfirmButton confirm="হ্যাঁ, রুটিন ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deleteRoutineAction(routine.id))}>
              ডিলিট
            </ConfirmButton>
          )}
        </span>
      </td>
    </tr>
  );
}

// ── Periods ──

function Periods({ routine, periods }: { routine: RoutineInfo; periods: Period[] }) {
  return (
    <Card title={`পিরিয়ড · রুটিন ${routine.name}`}>
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">দুটো পিরিয়ডের সময় একটার ভেতরে আরেকটা পড়তে পারবে না। বিকেলের হিফযের মতো লম্বা পিরিয়ডও একটা পিরিয়ড ধরা হয়।</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b">
              <th className={TH}>শুরু</th>
              <th className={TH}>শেষ</th>
              <th className={TH}>নাম (না দিলেও চলবে)</th>
              <th className={cn(TH, 'sticky right-0 bg-white')} />
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <PeriodRow key={p.id} routineId={routine.id} period={p} />
            ))}
            <PeriodRow key={`new-${periods.length}`} routineId={routine.id} />
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PeriodRow({ routineId, period }: { routineId: string; period?: Period }) {
  const { draft, set, dirty } = useDraft({ label: period?.label ?? '', startsAt: period ? timeInput(period.startsAt) : '', endsAt: period ? timeInput(period.endsAt) : '' });
  const { pending, run, line } = useAction();
  const save = () => run(() => savePeriodAction(routineId, { id: period?.id, ...draft }));
  return (
    <tr className={cn(ROW, dirty && ROW_DIRTY)}>
      <td className={TD}>
        <input type="time" className={INPUT} value={draft.startsAt} onChange={(e) => set({ startsAt: e.target.value })} aria-label={period ? `${periodTime(period)}: শুরু` : 'নতুন পিরিয়ডের শুরু'} />
      </td>
      <td className={TD}>
        <input type="time" className={INPUT} value={draft.endsAt} onChange={(e) => set({ endsAt: e.target.value })} aria-label={period ? `${periodTime(period)}: শেষ` : 'নতুন পিরিয়ডের শেষ'} />
      </td>
      <td className={TD}>
        <input className={cn(INPUT, 'w-full')} value={draft.label} onChange={(e) => set({ label: e.target.value })} placeholder="যেমন কুরআন, হিফয" maxLength={40} aria-label="পিরিয়ডের নাম" />
        {line}
      </td>
      <td className={cn(TD, ACTIONS)}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={period && !dirty ? 'outline' : 'default'} className={period && !dirty ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.startsAt || !draft.endsAt} onClick={save}>
            {period ? 'সেভ' : 'যোগ করুন'}
          </Button>
          {period && (
            <ConfirmButton confirm="হ্যাঁ, পিরিয়ড আর এর সব ক্লাস ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deletePeriodAction(period.id))}>
              ডিলিট
            </ConfirmButton>
          )}
        </span>
      </td>
    </tr>
  );
}

// ── Groups ──

const KIND_LABEL = { section: 'ক্লাস সেকশন', level: 'লেভেল গ্রুপ' };
const RULE_LABEL = { any: 'যেকোনো টিচার', male: 'শুধু পুরুষ টিচার', female: 'শুধু মহিলা টিচার' };

function Groups({ groups, rooms }: { groups: Group[]; rooms: Room[] }) {
  const sections = [...new Set(groups.map((g) => g.section).filter(Boolean))];
  const bands = [...new Set(groups.map((g) => g.band).filter(Boolean))];
  return (
    <Card title="গ্রুপ">
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">
        ক্লাস সেকশন (Nursery-A, Two (M)) আর লেভেলভিত্তিক গ্রুপ (Qaida-A, L-1 A)। &quot;শিরোনাম&quot; অনুযায়ী রুটিনে গ্রুপগুলো আলাদা হয়; একই &quot;ব্যান্ড&quot;-এর গ্রুপ (যেমন LEVEL-1-এর L-1 A, B, C) রুটিনে এক লেবেলের নিচে বসে। ক্রম ছোট থেকে বড়।
      </p>
      <datalist id="rt-sections">
        {sections.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="rt-bands">
        {bands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr className="border-b">
              <th className={TH}>নাম</th>
              <th className={TH}>টাইপ</th>
              <th className={TH}>সেকশন</th>
              <th className={TH}>ব্যান্ড</th>
              <th className={TH}>সিরিয়াল</th>
              <th className={TH}>রুম</th>
              <th className={TH}>টিচার</th>
              <th className={TH}>চালু</th>
              <th className={cn(TH, 'sticky right-0 bg-white')} />
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRow key={g.id} group={g} rooms={rooms} />
            ))}
            <GroupRow key={`new-${groups.length}`} rooms={rooms} nextSort={(groups.at(-1)?.sort ?? 0) + 10} />
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GroupRow({ group, rooms, nextSort = 0 }: { group?: Group; rooms: Room[]; nextSort?: number }) {
  const { draft, set, dirty } = useDraft({
    name: group?.name ?? '',
    kind: group?.kind ?? 'section',
    section: group?.section ?? '',
    band: group?.band ?? '',
    sort: group?.sort ?? nextSort,
    defaultRoomId: group?.defaultRoomId ?? null,
    genderRule: group?.genderRule ?? 'any',
    active: group?.active ?? true,
  });
  const { pending, run, line } = useAction();
  const label = group?.name ?? 'নতুন গ্রুপ';
  return (
    <tr className={cn(ROW, dirty && ROW_DIRTY)}>
      <td className={TD}>
        <input className={cn(INPUT, 'w-36')} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="যেমন Nursery-A" maxLength={120} aria-label={`${label}: নাম`} />
        {line}
      </td>
      <td className={TD}>
        <select className={SELECT} value={draft.kind} onChange={(e) => set({ kind: e.target.value as Group['kind'] })} aria-label={`${label}: টাইপ`}>
          {Object.entries(KIND_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td className={TD}>
        <input className={cn(INPUT, 'w-28')} list="rt-sections" value={draft.section} onChange={(e) => set({ section: e.target.value })} placeholder="জেনারেল" maxLength={60} aria-label={`${label}: সেকশন`} />
      </td>
      <td className={TD}>
        <input className={cn(INPUT, 'w-24')} list="rt-bands" value={draft.band} onChange={(e) => set({ band: e.target.value })} placeholder="যেমন LEVEL-1" maxLength={40} aria-label={`${label}: ব্যান্ড`} />
      </td>
      <td className={TD}>
        <input type="number" className={cn(INPUT, 'w-20')} value={draft.sort} onChange={(e) => set({ sort: Number(e.target.value) || 0 })} aria-label={`${label}: ক্রম`} />
      </td>
      <td className={TD}>
        <select className={SELECT} value={draft.defaultRoomId ?? ''} onChange={(e) => set({ defaultRoomId: e.target.value || null })} aria-label={`${label}: রুম`}>
          <option value="">—</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </td>
      <td className={TD}>
        <select className={SELECT} value={draft.genderRule} onChange={(e) => set({ genderRule: e.target.value as Group['genderRule'] })} aria-label={`${label}: টিচার`}>
          {Object.entries(RULE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td className={TD}>
        <input type="checkbox" className="size-4 accent-primary" checked={draft.active} onChange={(e) => set({ active: e.target.checked })} aria-label={`${label}: চালু`} />
      </td>
      <td className={cn(TD, ACTIONS)}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={group && !dirty ? 'outline' : 'default'} className={group && !dirty ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.name.trim()} onClick={() => run(() => saveGroupAction({ id: group?.id, ...draft }))}>
            {group ? 'সেভ' : 'যোগ করুন'}
          </Button>
          {group && (
            <ConfirmButton confirm="হ্যাঁ, গ্রুপ ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deleteGroupAction(group.id))}>
              ডিলিট
            </ConfirmButton>
          )}
        </span>
      </td>
    </tr>
  );
}

// ── Subjects ──

function Subjects({ subjects }: { subjects: Subject[] }) {
  return (
    <Card title="সাবজেক্ট">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className={TH}>নাম</th>
            <th className={TH}>সিরিয়াল</th>
            <th className={TH}>চালু</th>
            <th className={cn(TH, 'sticky right-0 bg-white')} />
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <SubjectRow key={s.id} subject={s} />
          ))}
          <SubjectRow key={`new-${subjects.length}`} nextSort={(subjects.at(-1)?.sort ?? 0) + 10} />
        </tbody>
      </table>
    </Card>
  );
}

function SubjectRow({ subject, nextSort = 0 }: { subject?: Subject; nextSort?: number }) {
  const { draft, set, dirty } = useDraft({ name: subject?.name ?? '', sort: subject?.sort ?? nextSort, active: subject?.active ?? true });
  const { pending, run, line } = useAction();
  const label = subject?.name ?? 'নতুন সাবজেক্ট';
  return (
    <tr className={cn(ROW, dirty && ROW_DIRTY)}>
      <td className={TD}>
        <input className={cn(INPUT, 'w-full')} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="যেমন Math" maxLength={120} aria-label={`${label}: নাম`} />
        {line}
      </td>
      <td className={TD}>
        <input type="number" className={cn(INPUT, 'w-16')} value={draft.sort} onChange={(e) => set({ sort: Number(e.target.value) || 0 })} aria-label={`${label}: ক্রম`} />
      </td>
      <td className={TD}>
        <input type="checkbox" className="size-4 accent-primary" checked={draft.active} onChange={(e) => set({ active: e.target.checked })} aria-label={`${label}: চালু`} />
      </td>
      <td className={cn(TD, ACTIONS)}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={subject && !dirty ? 'outline' : 'default'} className={subject && !dirty ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.name.trim()} onClick={() => run(() => saveSubjectAction({ id: subject?.id, ...draft }))}>
            {subject ? 'সেভ' : 'যোগ'}
          </Button>
          {subject && (
            <ConfirmButton confirm="হ্যাঁ, ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deleteSubjectAction(subject.id))}>
              ডিলিট
            </ConfirmButton>
          )}
        </span>
      </td>
    </tr>
  );
}

// ── Rooms ──

function Rooms({ rooms }: { rooms: Room[] }) {
  return (
    <Card title="রুম">
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">&quot;শেয়ার্ড&quot; রুমে (যেমন হল) একই সময়ে কয়েকটা ক্লাস বসতে পারে; বাকি রুমে একবারে একটা।</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className={TH}>নাম</th>
            <th className={TH}>শেয়ার্ড</th>
            <th className={cn(TH, 'sticky right-0 bg-white')} />
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <RoomRow key={r.id} room={r} />
          ))}
          <RoomRow key={`new-${rooms.length}`} />
        </tbody>
      </table>
    </Card>
  );
}

function RoomRow({ room }: { room?: Room }) {
  const { draft, set, dirty } = useDraft({ name: room?.name ?? '', shared: room?.shared ?? false });
  const { pending, run, line } = useAction();
  const label = room?.name ?? 'নতুন রুম';
  return (
    <tr className={cn(ROW, dirty && ROW_DIRTY)}>
      <td className={TD}>
        <input className={cn(INPUT, 'w-full')} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="যেমন 501, Hall" maxLength={120} aria-label={`${label}: নাম`} />
        {line}
      </td>
      <td className={TD}>
        <input type="checkbox" className="size-4 accent-primary" checked={draft.shared} onChange={(e) => set({ shared: e.target.checked })} aria-label={`${label}: শেয়ার্ড`} />
      </td>
      <td className={cn(TD, ACTIONS)}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={room && !dirty ? 'outline' : 'default'} className={room && !dirty ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.name.trim()} onClick={() => run(() => saveRoomAction({ id: room?.id, ...draft }))}>
            {room ? 'সেভ' : 'যোগ'}
          </Button>
          {room && (
            <ConfirmButton confirm="হ্যাঁ, ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deleteRoomAction(room.id))}>
              ডিলিট
            </ConfirmButton>
          )}
        </span>
      </td>
    </tr>
  );
}
