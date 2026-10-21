'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { editorChoices } from '@/lib/routine/availability';
import { clashText, findClashes, hostProblem, type Draft, type Lookup } from '@/lib/routine/clash';
import { DAY_SHORT, DAYS, distinctTimes, durationText, minutesOf, inputTime, parseSpan, sameTime, spanText } from '@/lib/routine/days';
import type { Assignment, RoutineData } from '@/lib/routine/types';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { deleteAssignmentAction, saveAssignmentAction } from './actions';
import { TA } from './cells';
import { Chips, ConfirmButton, INPUT, OUTLINE, SidePanel, useAction } from './controls';
import { TeacherPicker } from './TeacherPicker';

// The add / edit form for one lesson (docs/class-routine.md §5): class or group, its name, the
// subject, a typed time (an existing column or a new one), the days, where a seated group sits, and
// the teacher from the picker (free ones green, those who teach the subject first).

/** What opens the panel: a lesson to edit, or a new one, maybe from a cell (its row and time). */
export type PanelStart = { edit: Assignment } | { rowId?: string; time?: { startsAt: number; endsAt: number }; day?: number | null };

type Form = { id?: string; typeId: string; groupId: string; hostGroupId: string; subjectId: string; start: string; end: string; days: number[]; teacherId: string; taId: string; taOpen: boolean };

const LABEL = 'm-0 text-[13px] font-semibold text-foreground';

export function LessonPanel({ data, names, start, onDone }: { data: RoutineData; names: Lookup; start: PanelStart; onDone: (text: string, undo?: () => Promise<unknown>) => void }) {
  const placement = (typeId: string) => names.types.get(typeId)?.placement;
  const [form, setForm] = useState<Form>(() => initial(data, names, start));
  const { pending, run, line, warnings, clear } = useAction();
  // A warning answers the form as it was: any change asks again.
  const set = (patch: Partial<Form>) => {
    clear();
    setForm((f) => ({ ...f, ...patch }));
  };
  // Whether the save that brought up the warnings was "সেভ করে আরেকটা"; the note after one.
  const [again, setAgain] = useState(false);
  const [saved, setSaved] = useState('');
  const editing = 'edit' in start ? start.edit : undefined;

  const seated = placement(form.typeId) === 'seated';
  const span = parseSpan(form.start, form.end);
  const others = data.assignments.filter((a) => a.id !== form.id);
  const draft: Draft | null = span && {
    id: form.id,
    groupId: form.groupId,
    hostGroupId: seated ? form.hostGroupId || null : null,
    startsAt: span.startsAt,
    endsAt: span.endsAt,
    days: form.days,
    subjectId: form.subjectId,
    teacherId: form.teacherId || '-',
    taId: form.taId || null,
  };
  const clashes = draft && form.groupId && form.days.length ? findClashes(draft, others) : [];
  const host = form.groupId && seated ? hostProblem({ groupId: form.groupId, hostGroupId: form.hostGroupId || null }, names) : null;
  const choices = span ? editorChoices({ teachers: data.teachers, assignments: data.assignments, groups: names.groups, groupId: form.groupId, span, days: form.days, subjectId: form.subjectId, exceptId: form.id, keep: [editing?.teacherId ?? '', editing?.taId ?? ''] }) : [];
  const types = [...data.types].sort((a, b) => Number(a.placement !== 'class') - Number(b.placement !== 'class') || a.sort - b.sort);
  const groups = data.groups.filter((g) => g.typeId === form.typeId && (g.active || g.id === editing?.groupId));
  const subjects = data.subjects.filter((s) => s.typeId === form.typeId && (s.active || s.id === editing?.subjectId));
  const classes = data.groups.filter((g) => placement(g.typeId) === 'class' && (g.active || g.id === editing?.hostGroupId));
  const group = names.groups.get(form.groupId);
  const room = group?.defaultRoomId ? data.rooms.find((r) => r.id === group.defaultRoomId)?.name : null;
  const subjectName = names.subjects.get(form.subjectId)?.name ?? '';
  const ta = names.teachers.get(form.taId);
  const usedRows = seated && form.groupId ? [...new Set(others.filter((a) => a.groupId === form.groupId && a.hostGroupId).map((a) => names.groups.get(a.hostGroupId!)?.name ?? ''))] : [];
  const times = distinctTimes(data.assignments);
  const ready = !!draft && !!form.groupId && !!form.subjectId && !!form.teacherId && form.days.length > 0 && !host && clashes.length === 0;

  const timeNote = !span
    ? form.start || form.end
      ? 'সময়টা ঠিক নেই। যেমন ১০:৪৫ আর ১১:৩০ (১–৬টা বিকেল ধরা হয়)।'
      : 'শুরু আর শেষ লিখুন, বা নিচের আগের সময় থেকে বেছে নিন।'
    : (editing && sameTime(editing, span)) || others.some((a) => sameTime(a, span))
      ? `✓ ${spanText(span)} কলামে বসবে`
      : `নতুন কলাম তৈরি হবে: ${spanText(span)} (${durationText(minutesOf(span))})`;
  const timeTone = !span ? 'bg-muted text-muted-foreground' : timeNote.startsWith('✓') ? 'bg-success/10 text-success' : 'bg-[#eef4ff] text-[#1e40af]';

  const pickType = (typeId: string) => {
    const keepHost = placement(typeId) === 'seated' && placement(names.groups.get(form.hostGroupId)?.typeId ?? '') === 'class' ? form.hostGroupId : '';
    set({ typeId, groupId: '', subjectId: onlySubject(data, typeId), hostGroupId: keepHost });
  };
  const pickGroup = (groupId: string) => {
    if (placement(names.groups.get(groupId)?.typeId ?? '') !== 'seated') return set({ groupId, hostGroupId: '' });
    // A group sits where it sat last, unless a class's row was tapped.
    const last = data.assignments.find((a) => a.groupId === groupId && a.hostGroupId)?.hostGroupId ?? '';
    set({ groupId, hostGroupId: form.hostGroupId || last });
  };

  const values = () => draft && { ...draft, teacherId: form.teacherId };
  const save = (confirm: boolean, again: boolean) => {
    const lesson = values();
    if (!lesson) return;
    setAgain(again);
    setSaved('');
    run(
      () => saveAssignmentAction(data.routine.id, lesson, confirm),
      (result) => {
        const what = `${group?.name ?? ''} · ${subjectName}`;
        const fresh = !others.some((a) => sameTime(a, lesson)) && !(editing && sameTime(editing, lesson));
        const text = `${what} ${editing ? 'আপডেট হয়েছে' : 'সেভ হয়েছে'}${fresh ? ` · নতুন কলাম ${spanText(lesson)}` : ''}`;
        const undo = editing ? () => saveAssignmentAction(data.routine.id, editing, true) : () => deleteAssignmentAction(result.id!);
        // The panel stays open with the class or group and days kept (the page behind it refreshes).
        if (again) {
          setForm((f) => ({ ...f, id: undefined, subjectId: onlySubject(data, f.typeId), start: '', end: '', teacherId: '', taId: '', taOpen: false }));
          setSaved(`✓ ${text}`);
          return;
        }
        onDone(text, undo);
      },
    );
  };
  const remove = () =>
    editing &&
    run(
      () => deleteAssignmentAction(editing.id),
      () => onDone(`${group?.name ?? ''} · ${subjectName} ডিলিট হয়েছে`, () => saveAssignmentAction(data.routine.id, { ...editing, id: undefined }, true)),
    );

  return (
    <SidePanel
      title={editing ? 'ক্লাস এডিট' : 'নতুন ক্লাস'}
      description="সময় লিখলে সেই কলামে বসবে; নতুন সময় হলে নতুন কলাম হবে।"
      footer={
        <>
          {editing && (
            <ConfirmButton confirm="হ্যাঁ, ডিলিট করুন" disabled={pending} onConfirm={remove} className="text-sm">
              ডিলিট
            </ConfirmButton>
          )}
          <span className="flex-1" />
          {line}
          {saved && !line && (
            <span role="status" className="text-[13px] text-success">
              {saved}
            </span>
          )}
          {!editing && (
            <Button type="button" variant="outline" className={OUTLINE} disabled={pending || !ready} onClick={() => save(false, true)}>
              সেভ করে আরেকটা
            </Button>
          )}
          <Button type="button" className="h-9 px-5" disabled={pending || !ready} onClick={() => save(false, false)}>
            সেভ
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p className={LABEL}>ক্লাস, না কোন গ্রুপ</p>
        <Chips label="ধরন" options={types.map((t) => ({ value: t.id, label: t.placement === 'class' ? `ক্লাস (${t.name})` : `${t.name} গ্রুপ` }))} isOn={(v) => v === form.typeId} onToggle={pickType} />
      </div>

      <div className="flex flex-col gap-2">
        <p className={LABEL}>{placement(form.typeId) === 'class' ? 'ক্লাস' : 'গ্রুপ'}</p>
        {groups.length ? (
          <Chips label="নাম" options={groups.map((g) => ({ value: g.id, label: g.name }))} isOn={(v) => v === form.groupId} onToggle={pickGroup} />
        ) : (
          <p className="m-0 text-[13px] text-muted-foreground">এই ধরনে এখনো কিছু নেই। সেটআপে যোগ করুন।</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className={LABEL}>সাবজেক্ট</p>
        {subjects.length ? (
          <Chips label="সাবজেক্ট" options={subjects.map((s) => ({ value: s.id, label: s.name }))} isOn={(v) => v === form.subjectId} onToggle={(subjectId) => set({ subjectId })} />
        ) : (
          <p className="m-0 text-[13px] text-muted-foreground">এই ধরনের কোনো সাবজেক্ট নেই। সেটআপে যোগ করুন।</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className={LABEL}>সময়</p>
        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-[12.5px] text-muted-foreground">
            শুরু
            <input className={cn(INPUT, 'h-10 text-[15px] text-foreground')} inputMode="numeric" placeholder="যেমন ১০:৪৫" value={form.start} onChange={(e) => set({ start: e.target.value })} />
          </label>
          <span className="pb-2.5 text-muted-foreground">–</span>
          <label className="flex flex-1 flex-col gap-1 text-[12.5px] text-muted-foreground">
            শেষ
            <input className={cn(INPUT, 'h-10 text-[15px] text-foreground')} inputMode="numeric" placeholder="যেমন ১১:৩০" value={form.end} onChange={(e) => set({ end: e.target.value })} />
          </label>
        </div>
        <p role="status" className={cn('m-0 rounded-lg px-2.5 py-2 text-[13px]', timeTone)}>
          {timeNote}
        </p>
        {times.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground">আগের সময়:</span>
            {times.map((t) => (
              <button key={`${t.startsAt}-${t.endsAt}`} type="button" className="h-7 rounded-full border bg-[#faf9f7] px-2.5 text-[12px] hover:border-input" onClick={() => set({ start: inputTime(t.startsAt), end: inputTime(t.endsAt) })}>
                {spanText(t)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className={LABEL}>দিন</p>
        <Chips
          label="দিন"
          options={DAYS.map((d) => ({ value: d, label: DAY_SHORT[d] }))}
          isOn={(d) => form.days.includes(d)}
          onToggle={(d) => set({ days: form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d].sort() })}
        />
      </div>

      {seated ? (
        <div className="flex flex-col gap-2">
          <p className={LABEL}>কোথায় বসে</p>
          <p className="m-0 text-[12.5px] text-muted-foreground">
            যে ক্লাসের রুমে বসে, টেবিলে সেই সারিতে দেখাবে।{usedRows.length > 0 && ` আগে বসেছে: ${usedRows.join(', ')}।`}
          </p>
          {host && <p className="m-0 text-[12.5px] text-warning">{host}</p>}
          <Chips
            label="কোথায় বসে"
            options={classes.map((c) => ({ value: c.id, label: c.defaultRoomId ? `${c.name} · ${bn(data.rooms.find((r) => r.id === c.defaultRoomId)?.name ?? '')}` : c.name }))}
            isOn={(v) => v === form.hostGroupId}
            onToggle={(hostGroupId) => set({ hostGroupId })}
          />
        </div>
      ) : (
        group && <p className="m-0 text-[13px] text-muted-foreground">রুম: {room ? <b className="text-foreground">{bn(room)}</b> : 'দেওয়া নেই'} ({placement(group.typeId) === 'class' ? 'ক্লাসের রুম' : 'গ্রুপের নিজের রুম'})</p>
      )}

      {clashes.length > 0 && (
        <ul role="alert" className="m-0 flex list-none flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
          {clashes.map((c, i) => (
            <li key={i}>{clashText(c, names)}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <p className={LABEL}>টিচার</p>
        {!span || !form.days.length ? (
          <p className="m-0 text-[13px] text-muted-foreground">সময় আর দিন দিলে কে ফ্রি তা দেখাবে।</p>
        ) : (
          <TeacherPicker choices={choices} subjectName={subjectName} selected={form.teacherId} onPick={(id) => set({ teacherId: id === form.teacherId ? '' : id, taId: form.taId === id ? '' : form.taId })} foldBusy />
        )}
        {form.teacherId &&
          (ta && !form.taOpen ? (
            <p className="m-0 text-sm">
              টিএ: <span className={cn('font-medium', TA)}>{ta.shortName}</span>
              <button type="button" className="ml-3 text-[13px] underline underline-offset-4" onClick={() => set({ taOpen: true })}>
                বদলান
              </button>
              <button type="button" className="ml-3 text-[13px] text-destructive underline-offset-4 hover:underline" onClick={() => set({ taId: '' })}>
                টিএ বাদ দিন
              </button>
            </p>
          ) : form.taOpen ? (
            <div className="flex flex-col gap-2">
              <p className="m-0 text-[13px] font-medium text-muted-foreground">টিএ</p>
              <TeacherPicker choices={choices.filter((c) => c.teacher.id !== form.teacherId)} subjectName={subjectName} selected={form.taId} onPick={(id) => set({ taId: id === form.taId ? '' : id, taOpen: false })} foldBusy />
            </div>
          ) : (
            <button type="button" className={cn('self-start text-[13px] font-medium underline-offset-4 hover:underline', TA)} onClick={() => set({ taOpen: true })}>
              + টিএ যোগ করুন
            </button>
          ))}
      </div>

      {warnings.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-[13px] text-warning">
          {warnings.map((w, i) => (
            <p key={i} className="m-0">
              {w}
            </p>
          ))}
          <Button type="button" variant="outline" className={cn(OUTLINE, 'self-start text-foreground')} disabled={pending} onClick={() => save(true, again)}>
            তাও সেভ করুন
          </Button>
        </div>
      )}
    </SidePanel>
  );
}

/** A type with one subject (Hifz) has it chosen already. */
function onlySubject(data: RoutineData, typeId: string) {
  const list = data.subjects.filter((s) => s.typeId === typeId && s.active);
  return list.length === 1 ? list[0].id : '';
}

function initial(data: RoutineData, names: Lookup, start: PanelStart): Form {
  const firstClassType = [...data.types].filter((t) => t.placement === 'class').sort((a, b) => a.sort - b.sort)[0]?.id ?? data.types[0]?.id ?? '';
  if ('edit' in start) {
    const a = start.edit;
    const typeId = names.groups.get(a.groupId)?.typeId ?? firstClassType;
    return { id: a.id, typeId, groupId: a.groupId, hostGroupId: a.hostGroupId ?? '', subjectId: a.subjectId, start: inputTime(a.startsAt), end: inputTime(a.endsAt), days: a.days, teacherId: a.teacherId, taId: a.taId ?? '', taOpen: false };
  }
  const row = start.rowId ? names.groups.get(start.rowId) : undefined;
  const typeId = row?.typeId ?? firstClassType;
  const placement = names.types.get(typeId)?.placement;
  const lastHost = row && placement === 'seated' ? (data.assignments.find((a) => a.groupId === row.id && a.hostGroupId)?.hostGroupId ?? '') : '';
  return {
    typeId,
    groupId: row?.id ?? '',
    hostGroupId: placement === 'class' && row ? row.id : lastHost,
    subjectId: onlySubject(data, typeId),
    start: start.time ? inputTime(start.time.startsAt) : '',
    end: start.time ? inputTime(start.time.endsAt) : '',
    days: start.day != null ? [start.day] : [...DAYS],
    teacherId: '',
    taId: '',
    taOpen: false,
  };
}
