'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowDown, ArrowUp, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import type { RoutineSummary } from '@/lib/routine/data';
import type { ClassType, GenderRule, Group, Placement, Room, RoutineInfo, Subject, Teacher } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import {
  activateRoutineAction,
  createRoutineAction,
  deleteGroupAction,
  deleteRoomAction,
  deleteRoutineAction,
  deleteSubjectAction,
  deleteTypeAction,
  moveTypeAction,
  renameRoutineAction,
  saveGroupAction,
  saveRoomAction,
  saveSubjectAction,
  saveTypeAction,
  type Result,
} from '../actions';
import { Chips, ConfirmButton, INPUT, OUTLINE, RoutineDialog, SidePanel, useAction, useUndo } from '../controls';

// Routine setup (docs/class-routine.md §4) in tabs: ক্লাসের ধরন (their order is the routine table's),
// ক্লাস ও গ্রুপ and সাবজেক্ট under their type, রুম, and the routine's versions. A row's এডিট opens
// the side panel; ⋯ holds the rest.

export type Tab = 'types' | 'classes' | 'subjects' | 'rooms' | 'routines';
const TABS: [Tab, string][] = [
  ['types', 'ক্লাসের ধরন'],
  ['classes', 'ক্লাস ও গ্রুপ'],
  ['subjects', 'সাবজেক্ট'],
  ['rooms', 'রুম'],
  ['routines', 'রুটিন ভার্সন'],
];
const NEW: Record<Tab, string> = { types: 'নতুন ধরন', classes: 'নতুন ক্লাস বা গ্রুপ', subjects: 'নতুন সাবজেক্ট', rooms: 'নতুন রুম', routines: 'নতুন ভার্সন' };

const PLACEMENTS: { value: Placement; label: string; help: string }[] = [
  { value: 'class', label: 'ক্লাস', help: 'নিজের রুম; টেবিলে "ক্লাস" অংশে একটা সারি' },
  { value: 'own_room', label: 'নিজের রুমের গ্রুপ', help: 'হিফয, নাজেরার মতো; টেবিলের উপরে নিজের সারি' },
  { value: 'seated', label: 'ক্লাসের রুমে বসা গ্রুপ', help: 'কুরআন, আরবির মতো; যে ক্লাসের রুমে বসে সেই সারিতে দেখায়' },
];
const RULES: { value: GenderRule; label: string }[] = [
  { value: 'any', label: 'যেকোনো টিচার' },
  { value: 'male', label: 'শুধু পুরুষ' },
  { value: 'female', label: 'শুধু মহিলা' },
];

type Props = { tab: Tab; routines: RoutineSummary[]; current: RoutineInfo | null; types: ClassType[]; groups: Group[]; subjects: Subject[]; rooms: Room[]; teachers: Teacher[]; lessons: Record<string, number> };
type Panel = { tab: Tab; id?: string };
type Row = { key: string; title: string; sub: string; badges?: { text: string; tone: 'green' | 'grey' | 'blue' }[]; edit: () => void; move?: (step: -1 | 1) => void; menu: { label: string; run?: () => void; href?: string; danger?: boolean }[] };

const BADGE = { green: 'bg-success/10 text-success', grey: 'bg-muted text-muted-foreground', blue: 'bg-[#eef4ff] text-[#1e40af]' };

export function SetupBoard(props: Props) {
  const { routines, current, types, groups, subjects, rooms, teachers, lessons } = props;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(props.tab);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [panelKey, setPanelKey] = useState(0);
  const { show, node: toast } = useUndo();
  const { run } = useAction();
  const [asking, setAsking] = useState<{ title: string; body: string; confirm?: string; run: () => void } | null>(null);
  const open = (p: Panel) => {
    setPanel(p);
    setPanelKey((k) => k + 1);
  };
  const pick = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', t);
    window.history.replaceState(null, '', url);
  };
  // Runs an action from a row; a refusal shows in the toast.
  const act = (action: () => Promise<Result>, done: string, undo?: () => Promise<Result>) =>
    run(async () => {
      const result = await action();
      show(result.ok ? done : result.error, result.ok && undo ? () => void undo() : undefined);
      return result;
    });
  const roomName = (id: string | null) => rooms.find((r) => r.id === id)?.name;
  const typeOf = (id: string) => types.find((t) => t.id === id);

  const counts: Record<Tab, number> = { types: types.length, classes: groups.length, subjects: subjects.length, rooms: rooms.length, routines: routines.length };
  const sections: { title?: string; rows: Row[] }[] = [];
  if (tab === 'types') {
    sections.push({
      rows: types.map((t) => ({
        key: t.id,
        title: t.name,
        sub: `${PLACEMENTS.find((p) => p.value === t.placement)?.label} · ${bn(groups.filter((g) => g.typeId === t.id).length)}টা ক্লাস/গ্রুপ · ${bn(subjects.filter((s) => s.typeId === t.id).length)}টা সাবজেক্ট`,
        edit: () => open({ tab, id: t.id }),
        move: (step) => run(() => moveTypeAction(t.id, step)),
        menu: [{ label: 'ডিলিট', danger: true, run: () => setAsking({ title: `${t.name} ধরন ডিলিট করবেন?`, body: 'ধরনটা খালি হলে (কোনো ক্লাস, গ্রুপ বা সাবজেক্ট নেই) তবেই ডিলিট হবে।', run: () => act(() => deleteTypeAction(t.id), `${t.name} ডিলিট হয়েছে`) }) }],
      })),
    });
  } else if (tab === 'classes' || tab === 'subjects') {
    for (const t of types) {
      const rows: Row[] =
        tab === 'classes'
          ? groups
              .filter((g) => g.typeId === t.id)
              .map((g) => {
                const room = roomName(g.defaultRoomId);
                const badges: Row['badges'] = [];
                if (g.genderRule !== 'any') badges.push({ text: g.genderRule === 'male' ? 'শুধু পুরুষ টিচার' : 'শুধু মহিলা টিচার', tone: 'blue' });
                if (!g.active) badges.push({ text: 'বন্ধ', tone: 'grey' });
                return {
                  key: g.id,
                  title: g.name,
                  sub: [t.placement === 'seated' ? 'ক্লাসের রুমে বসে' : room ? `রুম ${bn(room)}` : 'রুম দেওয়া নেই', `রুটিনে ${bn(lessons[g.id] ?? 0)}টা এন্ট্রি`].join(' · '),
                  badges,
                  edit: () => open({ tab, id: g.id }),
                  menu: [
                    { label: 'এর রুটিন', href: `/admin/routine/groups/${g.id}` },
                    { label: 'ডিলিট', danger: true, run: () => act(() => deleteGroupAction(g.id), `${g.name} ডিলিট হয়েছে`, () => saveGroupAction({ ...g, id: undefined })) },
                  ],
                };
              })
          : subjects
              .filter((s) => s.typeId === t.id)
              .map((s) => ({
                key: s.id,
                title: s.name,
                sub: `${bn(teachers.filter((x) => x.subjectIds.includes(s.id)).length)} জন টিচার পড়ান`,
                badges: s.active ? [] : [{ text: 'বন্ধ', tone: 'grey' as const }],
                edit: () => open({ tab, id: s.id }),
                menu: [{ label: 'ডিলিট', danger: true, run: () => setAsking({ title: `${s.name} ডিলিট করবেন?`, body: 'টিচারদের সাবজেক্টের লিস্ট থেকেও বাদ যাবে। রুটিনে থাকলে ডিলিট হবে না; তখন এডিটে গিয়ে বন্ধ করুন।', run: () => act(() => deleteSubjectAction(s.id), `${s.name} ডিলিট হয়েছে`) }) }],
              }));
      if (rows.length) sections.push({ title: `${t.name} · ${bn(rows.length)}`, rows });
    }
  } else if (tab === 'rooms') {
    sections.push({
      rows: rooms.map((r) => {
        const used = groups.filter((g) => g.defaultRoomId === r.id).map((g) => g.name);
        return {
          key: r.id,
          title: `রুম ${bn(r.name)}`,
          sub: used.length ? `যাদের রুম: ${used.join(', ')}` : 'কারও নিজের রুম না',
          edit: () => open({ tab, id: r.id }),
          menu: [{ label: 'ডিলিট', danger: true, run: () => setAsking({ title: `রুম ${bn(r.name)} ডিলিট করবেন?`, body: used.length ? `${used.join(', ')}-এর রুম খালি হয়ে যাবে।` : 'কারও নিজের রুম না।', run: () => act(() => deleteRoomAction(r.id), `রুম ${bn(r.name)} ডিলিট হয়েছে`) }) }],
        };
      }),
    });
  } else {
    sections.push({
      rows: routines.map((v) => ({
        key: v.id,
        title: v.name,
        sub: `${bn(v.assignments)}টা এন্ট্রি${v.id === current?.id ? ' · এখন দেখছেন' : ''}`,
        badges: [v.status === 'active' ? { text: 'চালু', tone: 'green' as const } : { text: 'ড্রাফট', tone: 'grey' as const }],
        edit: () => open({ tab, id: v.id }),
        menu: [
          { label: 'রুটিন দেখুন', href: `/admin/routine${v.status === 'active' ? '' : `?r=${v.id}`}` },
          ...(v.status === 'active' ? [] : [{ label: 'চালু করুন', run: () => setAsking({ title: `${v.name} চালু করবেন?`, body: 'এখন যেটা চালু আছে সেটা ড্রাফট হবে। ফ্রি টিচার, প্রক্সি আর ওয়ার্কলোড এটা দেখে হিসাব হবে। আজ আর সামনের দিনের যে প্রক্সি দেওয়া আছে, সেগুলো বাদ যাবে; আবার দিতে হবে।', confirm: 'চালু করুন', run: () => act(() => activateRoutineAction(v.id), `${v.name} চালু হয়েছে`) }) }]),
          { label: 'কপি করে নতুন ভার্সন', run: () => open({ tab, id: `copy:${v.id}` }) },
        ],
      })),
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b">
        <div role="tablist" aria-label="সেটআপ" className="-mb-px flex max-w-full overflow-x-auto">
          {TABS.map(([t, label]) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => pick(t)}
              className={cn('whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm', tab === t ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
            >
              {label} <span className="text-[12px] font-normal text-muted-foreground">{bn(counts[t])}</span>
            </button>
          ))}
        </div>
        <Button type="button" className="mb-2 h-9" onClick={() => open({ tab })}>
          <Plus aria-hidden /> {NEW[tab]}
        </Button>
      </div>

      {tab === 'types' && <p className="m-0 text-[13px] text-muted-foreground">রুটিন টেবিলে এই ক্রমে আসে। একটা সাবজেক্ট একটাই ধরনে থাকে; ক্লাস যোগ করার ফর্মে শুধু সেই ধরনের সাবজেক্ট আসে।</p>}
      {tab === 'routines' && <p className="m-0 text-[13px] text-muted-foreground">একবারে একটা রুটিন চালু থাকে; ফ্রি টিচার, প্রক্সি আর ওয়ার্কলোড সেটা দেখেই হিসাব হয়। নতুন বছর বা রমজানের রুটিন বানাতে চালুটা কপি করুন, ড্রাফটে ঠিক করুন, তারপর চালু করুন।</p>}

      {sections.length === 0 || sections.every((s) => !s.rows.length) ? (
        <p className="m-0 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">এখনো কিছু নেই। উপরের &quot;{NEW[tab]}&quot; চাপুন।</p>
      ) : (
        sections.map((s, i) => (
          <section key={s.title ?? i} className="flex flex-col gap-2">
            {s.title && <h2 className="m-0 text-[13px] font-semibold text-muted-foreground">{s.title}</h2>}
            <ul className="m-0 flex list-none flex-col divide-y rounded-xl border bg-card p-0">
              {s.rows.map((r, j) => (
                <li key={r.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  {r.move && (
                    <span className="flex gap-1">
                      <button type="button" disabled={j === 0} onClick={() => r.move!(-1)} aria-label={`${r.title} উপরে`} className="inline-flex size-7 items-center justify-center rounded-md border bg-white disabled:opacity-30">
                        <ArrowUp aria-hidden className="size-3.5" />
                      </button>
                      <button type="button" disabled={j === s.rows.length - 1} onClick={() => r.move!(1)} aria-label={`${r.title} নিচে`} className="inline-flex size-7 items-center justify-center rounded-md border bg-white disabled:opacity-30">
                        <ArrowDown aria-hidden className="size-3.5" />
                      </button>
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {r.title}
                      {r.badges?.map((b) => (
                        <span key={b.text} className={cn('rounded-full px-2 py-px text-[12px] font-semibold', BADGE[b.tone])}>
                          {b.text}
                        </span>
                      ))}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">{r.sub}</span>
                  </span>
                  <Button type="button" variant="outline" className={cn(OUTLINE, 'h-8')} onClick={r.edit}>
                    এডিট
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-md border bg-white text-muted-foreground hover:bg-muted" aria-label={`${r.title}: আরও`}>
                      <MoreHorizontal aria-hidden className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="adm w-52">
                      {r.menu.map((m) =>
                        m.href ? (
                          <DropdownMenuItem key={m.label} asChild>
                            <Link href={m.href}>{m.label}</Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem key={m.label} onSelect={m.run} className={cn(m.danger && 'text-destructive focus:text-destructive')}>
                            {m.label}
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Dialog open={!!panel} onOpenChange={(o) => !o && setPanel(null)}>
        {panel && (
          <EditPanel
            key={panelKey}
            panel={panel}
            {...props}
            typeOf={typeOf}
            onDone={(text, id) => {
              setPanel(null);
              show(text);
              // A new version opens in the routine page (its id comes back); a rename stays.
              if (id && panel.tab === 'routines' && !(panel.id && !panel.id.startsWith('copy:'))) router.push(`/admin/routine?r=${id}`);
            }}
          />
        )}
      </Dialog>
      <Dialog open={!!asking} onOpenChange={(o) => !o && setAsking(null)}>
        {asking && (
          <RoutineDialog className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{asking.title}</DialogTitle>
              <DialogDescription>{asking.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" className={OUTLINE} onClick={() => setAsking(null)}>
                বাতিল
              </Button>
              <Button
                type="button"
                variant={asking.confirm ? 'default' : 'destructive'}
                className="h-9"
                onClick={() => {
                  asking.run();
                  setAsking(null);
                }}
              >
                {asking.confirm ?? 'ডিলিট'}
              </Button>
            </DialogFooter>
          </RoutineDialog>
        )}
      </Dialog>
      {toast}
    </>
  );
}

/** The side panel for one row (or a new one): name, and what that kind of row needs. */
function EditPanel({ panel, types, groups, subjects, rooms, routines, typeOf, onDone }: Props & { panel: Panel; typeOf: (id: string) => ClassType | undefined; onDone: (text: string, id?: string) => void }) {
  const { tab } = panel;
  const copyFrom = panel.id?.startsWith('copy:') ? panel.id.slice(5) : null;
  const id = copyFrom ? undefined : panel.id;
  const type = tab === 'types' ? types.find((t) => t.id === id) : undefined;
  const group = tab === 'classes' ? groups.find((g) => g.id === id) : undefined;
  const subject = tab === 'subjects' ? subjects.find((s) => s.id === id) : undefined;
  const room = tab === 'rooms' ? rooms.find((r) => r.id === id) : undefined;
  const routine = tab === 'routines' ? routines.find((r) => r.id === id) : undefined;
  const general = types.find((t) => t.placement === 'class')?.id ?? types[0]?.id ?? '';
  const [name, setName] = useState(type?.name ?? group?.name ?? subject?.name ?? room?.name ?? routine?.name ?? '');
  const [placement, setPlacement] = useState<Placement>(type?.placement ?? 'class');
  const [typeId, setTypeId] = useState(group?.typeId ?? subject?.typeId ?? general);
  const [roomId, setRoomId] = useState(group?.defaultRoomId ?? '');
  const [rule, setRule] = useState<GenderRule>(group?.genderRule ?? 'any');
  const [active, setActive] = useState(group?.active ?? subject?.active ?? true);
  const [source, setSource] = useState(copyFrom ?? routines.find((r) => r.status === 'active')?.id ?? '');
  const { pending, run, line } = useAction();
  const seated = typeOf(typeId)?.placement === 'seated';
  const label = { types: 'ধরন', classes: 'ক্লাস বা গ্রুপ', subjects: 'সাবজেক্ট', rooms: 'রুম', routines: 'রুটিন ভার্সন' }[tab];
  const placeholder = { types: 'যেমন হিফয', classes: 'যেমন Hifz-3 (M)', subjects: 'যেমন Tajweed', rooms: 'যেমন ৫০৫', routines: 'যেমন ২০২৮ রমজান' }[tab];
  const fresh = !id;

  const save = () =>
    run(
      () => {
        const n = name.trim();
        if (tab === 'types') return saveTypeAction({ id, name: n, placement });
        if (tab === 'classes') {
          const last = Math.max(0, ...groups.map((g) => g.sort));
          return saveGroupAction({ id, name: n, typeId, sort: group?.sort ?? last + 10, defaultRoomId: seated ? null : roomId || null, genderRule: rule, active });
        }
        if (tab === 'subjects') {
          const last = Math.max(0, ...subjects.map((s) => s.sort));
          return saveSubjectAction({ id, name: n, typeId, sort: subject?.sort ?? last + 10, active });
        }
        if (tab === 'rooms') return saveRoomAction({ id, name: n });
        return id ? renameRoutineAction(id, n) : createRoutineAction(n, source || null);
      },
      (result) => onDone(`${name.trim()} ${fresh ? 'যোগ হয়েছে' : 'সেভ হয়েছে'}`, result.id),
    );

  return (
    <SidePanel
      title={fresh ? (copyFrom ? 'কপি করে নতুন ভার্সন' : `নতুন ${label}`) : `${label} এডিট`}
      footer={
        <>
          {routine && routine.status !== 'active' && (
            <ConfirmButton confirm="হ্যাঁ, ভার্সন আর এর সব এন্ট্রি ডিলিট করুন" disabled={pending} onConfirm={() => run(() => deleteRoutineAction(routine.id), () => onDone(`${routine.name} ডিলিট হয়েছে`))} className="text-sm">
              ডিলিট
            </ConfirmButton>
          )}
          <span className="flex-1" />
          {line}
          <Button type="button" className="h-9 px-5" disabled={pending || !name.trim() || (tab !== 'types' && tab !== 'rooms' && tab !== 'routines' && !typeId)} onClick={save}>
            সেভ
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        নাম
        <input className={cn(INPUT, 'h-10 text-[15px] font-normal')} value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} maxLength={120} autoFocus />
      </label>

      {tab === 'types' && (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[13px] font-semibold">কোথায় বসে</p>
          {PLACEMENTS.map((p) => (
            <label key={p.value} className={cn('flex cursor-pointer gap-2.5 rounded-lg border px-3 py-2.5', placement === p.value ? 'border-primary bg-primary/5' : 'bg-white')}>
              <input type="radio" name="placement" className="mt-1 accent-primary" checked={placement === p.value} onChange={() => setPlacement(p.value)} />
              <span className="flex flex-col">
                <span className="font-medium">{p.label}</span>
                <span className="text-[12.5px] text-muted-foreground">{p.help}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {(tab === 'classes' || tab === 'subjects') && (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[13px] font-semibold">ক্লাসের ধরন</p>
          <Chips label="ক্লাসের ধরন" options={types.map((t) => ({ value: t.id, label: t.name }))} isOn={(v) => v === typeId} onToggle={setTypeId} />
          {tab === 'subjects' && <p className="m-0 text-[12.5px] text-muted-foreground">একটা সাবজেক্ট একটাই ধরনে থাকে। ক্লাস যোগ করার ফর্মে শুধু সেই ধরনের সাবজেক্ট আসে।</p>}
        </div>
      )}

      {tab === 'classes' && (
        <>
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[13px] font-semibold">রুম</p>
            {seated ? (
              <p className="m-0 text-[13px] text-muted-foreground">এই গ্রুপ কোনো ক্লাসের রুমে বসে; ক্লাস যোগ করার সময় কোথায় বসে সেটা বেছে নেওয়া হয়।</p>
            ) : (
              <Chips label="রুম" options={[{ value: '', label: 'রুম নেই' }, ...rooms.map((r) => ({ value: r.id, label: bn(r.name) }))]} isOn={(v) => v === roomId} onToggle={setRoomId} />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[13px] font-semibold">কে পড়াতে পারবেন</p>
            <Chips label="কে পড়াতে পারবেন" options={RULES} isOn={(v) => v === rule} onToggle={setRule} />
          </div>
        </>
      )}

      {(tab === 'classes' || tab === 'subjects') && (
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span className="flex flex-col">
            চালু
            <span className="text-[12.5px] text-muted-foreground">বন্ধ করলে নতুন ক্লাস যোগ করার ফর্মে আসে না; রুটিনে যা আছে তা থাকে।</span>
          </span>
        </label>
      )}

      {tab === 'routines' && fresh && (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[13px] font-semibold">শুরু</p>
          <Chips label="শুরু" options={[{ value: '', label: 'খালি রুটিন' }, ...routines.map((r) => ({ value: r.id, label: `${r.name} কপি করে` }))]} isOn={(v) => v === source} onToggle={setSource} />
        </div>
      )}
      {routine && <p className="m-0 text-[13px] text-muted-foreground">{routine.status === 'active' ? 'এটা চালু রুটিন, তাই ডিলিট করা যায় না।' : `${bn(routine.assignments)}টা এন্ট্রি আছে। চালু করতে লিস্টের ⋯ থেকে "চালু করুন"।`}</p>}
    </SidePanel>
  );
}
