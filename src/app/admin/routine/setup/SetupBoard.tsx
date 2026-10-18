'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

/** Local copy of a row that resets when the saved row changes. */
function useDraft<T>(saved: T) {
  const [draft, setDraft] = useState(saved);
  const key = JSON.stringify(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the saved values change
  useEffect(() => setDraft(saved), [key]);
  const dirty = JSON.stringify(draft) !== key;
  return { draft, set: (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch })), dirty, reset: () => setDraft(saved) };
}

const TH = 'px-2 py-2 text-left text-[12.5px] font-medium text-muted-foreground';
const TD = 'px-2 py-1.5 align-middle';

// ── Routines ──

function Routines({ routines, current }: { routines: RoutineSummary[]; current: RoutineInfo | null }) {
  const set = useParam();
  const { pending, run, line } = useAction();
  const [name, setName] = useState('');
  const [copyFrom, setCopyFrom] = useState(current?.id ?? '');
  return (
    <Card title="রুটিন">
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">
        একটি রুটিন চালু থাকে: ফ্রি শিক্ষক, প্রক্সি আর ওয়ার্কলোড সেটি থেকে হিসাব হয়। নতুন বছরের রুটিন বানাতে চালু রুটিনটি কপি করে খসড়া হিসেবে সাজান, তারপর চালু করুন।
      </p>
      {routines.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b">
                <th className={TH}>নাম</th>
                <th className={TH}>অবস্থা</th>
                <th className={TH}>পিরিয়ড</th>
                <th className={TH}>ক্লাস</th>
                <th className={TH} />
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
            <option value="">খালি রুটিন</option>
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} কপি করে
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="h-9" disabled={pending || !name.trim()}>
          রুটিন তৈরি করুন
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
      <td className={cn(TD, active ? 'text-success' : 'text-muted-foreground')}>{active ? 'চালু' : 'খসড়া'}</td>
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
            <ConfirmButton confirm="রুটিন মুছুন" disabled={pending} onConfirm={() => run(() => deleteRoutineAction(routine.id))}>
              মুছুন
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
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">সময়গুলো একটি আরেকটির সাথে মিলতে পারবে না। লম্বা পিরিয়ডও (যেমন বিকেলের হিফয) একটি পিরিয়ড হিসেবে গোনা হয়।</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b">
              <th className={TH}>শুরু</th>
              <th className={TH}>শেষ</th>
              <th className={TH}>নাম (ঐচ্ছিক)</th>
              <th className={TH} />
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
    <tr className="border-b last:border-0">
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
      <td className={cn(TD, 'whitespace-nowrap text-right')}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={period ? 'outline' : 'default'} className={period ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.startsAt || !draft.endsAt} onClick={save}>
            {period ? 'সেভ' : 'যোগ করুন'}
          </Button>
          {period && (
            <ConfirmButton confirm="পিরিয়ড ও এর সব ক্লাস মুছুন" disabled={pending} onConfirm={() => run(() => deletePeriodAction(period.id))}>
              মুছুন
            </ConfirmButton>
          )}
        </span>
      </td>
    </tr>
  );
}

// ── Groups ──

const KIND_LABEL = { section: 'ক্লাস সেকশন', level: 'লেভেল গ্রুপ' };
const RULE_LABEL = { any: 'যেকোনো শিক্ষক', male: 'শুধু পুরুষ', female: 'শুধু মহিলা' };

function Groups({ groups, rooms }: { groups: Group[]; rooms: Room[] }) {
  const sections = [...new Set(groups.map((g) => g.section).filter(Boolean))];
  return (
    <Card title="গ্রুপ">
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">
        ক্লাস সেকশন (Nursery-A, Two (M)) আর লেভেলভিত্তিক গ্রুপ (Qaida-A, Arabic L-3)। &quot;শিরোনাম&quot; অনুযায়ী রুটিনে গ্রুপগুলো আলাদা টেবিলে দেখায়; ক্রম ছোট থেকে বড়।
      </p>
      <datalist id="rt-sections">
        {sections.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b">
              <th className={TH}>নাম</th>
              <th className={TH}>ধরন</th>
              <th className={TH}>শিরোনাম</th>
              <th className={TH}>ক্রম</th>
              <th className={TH}>রুম</th>
              <th className={TH}>শিক্ষক</th>
              <th className={TH}>চালু</th>
              <th className={TH} />
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
    sort: group?.sort ?? nextSort,
    defaultRoomId: group?.defaultRoomId ?? null,
    genderRule: group?.genderRule ?? 'any',
    active: group?.active ?? true,
  });
  const { pending, run, line } = useAction();
  const label = group?.name ?? 'নতুন গ্রুপ';
  return (
    <tr className="border-b last:border-0">
      <td className={TD}>
        <input className={cn(INPUT, 'w-36')} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="যেমন Nursery-A" maxLength={120} aria-label={`${label}: নাম`} />
        {line}
      </td>
      <td className={TD}>
        <select className={SELECT} value={draft.kind} onChange={(e) => set({ kind: e.target.value as Group['kind'] })} aria-label={`${label}: ধরন`}>
          {Object.entries(KIND_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td className={TD}>
        <input className={cn(INPUT, 'w-28')} list="rt-sections" value={draft.section} onChange={(e) => set({ section: e.target.value })} placeholder="জেনারেল" maxLength={60} aria-label={`${label}: শিরোনাম`} />
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
        <select className={SELECT} value={draft.genderRule} onChange={(e) => set({ genderRule: e.target.value as Group['genderRule'] })} aria-label={`${label}: শিক্ষক`}>
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
      <td className={cn(TD, 'whitespace-nowrap text-right')}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={group ? 'outline' : 'default'} className={group ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.name.trim()} onClick={() => run(() => saveGroupAction({ id: group?.id, ...draft }))}>
            {group ? 'সেভ' : 'যোগ করুন'}
          </Button>
          {group && (
            <ConfirmButton confirm="গ্রুপ মুছুন" disabled={pending} onConfirm={() => run(() => deleteGroupAction(group.id))}>
              মুছুন
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
    <Card title="বিষয়">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className={TH}>নাম</th>
            <th className={TH}>ক্রম</th>
            <th className={TH}>চালু</th>
            <th className={TH} />
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
  const label = subject?.name ?? 'নতুন বিষয়';
  return (
    <tr className="border-b last:border-0">
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
      <td className={cn(TD, 'whitespace-nowrap text-right')}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={subject ? 'outline' : 'default'} className={subject ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.name.trim()} onClick={() => run(() => saveSubjectAction({ id: subject?.id, ...draft }))}>
            {subject ? 'সেভ' : 'যোগ'}
          </Button>
          {subject && (
            <ConfirmButton confirm="মুছুন" disabled={pending} onConfirm={() => run(() => deleteSubjectAction(subject.id))}>
              মুছুন
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
      <p className="m-0 mb-3 text-[13px] text-muted-foreground">&quot;শেয়ার করা&quot; রুমে (যেমন হল) একই সময়ে একাধিক গ্রুপ বসতে পারে; অন্য রুমে একটি।</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className={TH}>নাম</th>
            <th className={TH}>শেয়ার করা</th>
            <th className={TH} />
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
    <tr className="border-b last:border-0">
      <td className={TD}>
        <input className={cn(INPUT, 'w-full')} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="যেমন 501, Hall" maxLength={120} aria-label={`${label}: নাম`} />
        {line}
      </td>
      <td className={TD}>
        <input type="checkbox" className="size-4 accent-primary" checked={draft.shared} onChange={(e) => set({ shared: e.target.checked })} aria-label={`${label}: শেয়ার করা`} />
      </td>
      <td className={cn(TD, 'whitespace-nowrap text-right')}>
        <span className="inline-flex items-center gap-3">
          <Button type="button" variant={room ? 'outline' : 'default'} className={room ? OUTLINE : 'h-9'} disabled={pending || !dirty || !draft.name.trim()} onClick={() => run(() => saveRoomAction({ id: room?.id, ...draft }))}>
            {room ? 'সেভ' : 'যোগ'}
          </Button>
          {room && (
            <ConfirmButton confirm="মুছুন" disabled={pending} onConfirm={() => run(() => deleteRoomAction(room.id))}>
              মুছুন
            </ConfirmButton>
          )}
        </span>
      </td>
    </tr>
  );
}
