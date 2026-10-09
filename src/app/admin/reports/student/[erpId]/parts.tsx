import { formatDateTime } from '@/lib/survey/dates';
import { KIND_LABEL } from '@/lib/survey/labels';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { FLAGS, formatMark, GUARDIAN_AREAS } from '@/lib/survey/report-math';
import { cn } from '@/lib/utils';
import { MarkChip, markTone } from '../../charts';
import { average, submittedBy, type StudentPage } from './data';

// The student page's pieces, shared by the page and its internal print.

export const TABLE = 'w-full border-collapse text-sm';
export const HEAD = 'text-[13px] text-muted-foreground [&>th]:border-b [&>th]:px-2.5 [&>th]:py-2 [&>th]:font-medium';
export const ROW = '[&>td]:border-b [&>td]:px-2.5 [&>td]:py-2 [&>th]:border-b [&>th]:px-2.5 [&>th]:py-2';
export const MUTED = 'm-0 text-[13.5px] text-muted-foreground';

type Grid = StudentPage['report']['grid'];

/** The four marks an answer can have; an average takes the colour of the step below it. */
export function MarkLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
      মার্ক:
      {([10, 8, 6, 4] as const).map((m) => {
        const tone = markTone(m);
        return (
          <span key={m} className="sv-mark" style={{ background: tone.bg, color: tone.fg }}>
            {bn(m)}
          </span>
        );
      })}
      <span>গড়ের রঙ তার নিচের ধাপের, যেমন ৭.৫ = ৬-এর রঙ · ৭ বা কম = কম মার্ক</span>
    </div>
  );
}

/** The flags, then whatever has not come in yet. */
export function AttentionList({ data }: { data: StudentPage }) {
  const { flags, missing } = data;
  if (flags.length === 0 && missing.length === 0) return <p className={MUTED}>কিছু নেই।</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[14.5px]">
      {flags.map((f) => (
        <li key={f.kind} className="flex items-start gap-2.5 font-medium text-warning">
          <span aria-hidden>⚠</span>
          {f.label}
        </li>
      ))}
      {missing.length > 0 && (
        <li className="flex items-start gap-2.5">
          <span aria-hidden className="text-muted-foreground">
            ○
          </span>
          <span>
            <b className="font-semibold">এখনো জমা হয়নি:</b> <span className="text-muted-foreground">{missing.join(' · ')}</span>
          </span>
        </li>
      )}
    </ul>
  );
}

export function Hint({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return <span className="block text-[12.5px] font-normal text-muted-foreground">{text}</span>;
}

/** Teacher and guardian on the areas both rated, with the গড় row (⚠ from FLAGS.guardianTeacherGap). */
export function CompareTable({ data }: { data: StudentPage }) {
  const { compared, shared, teacherTotal, guardianOnly, teacherOnly } = data;
  if (compared.length === 0) return <p className={MUTED}>এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই।</p>;
  const row = (name: string, teacher: number | null, guardian: number | null, gap: number | null, total = false) => {
    const wide = gap !== null && Math.round(gap * 10) / 10 >= FLAGS.guardianTeacherGap;
    return (
      <tr key={name} className={cn(ROW, wide && 'bg-[var(--sv-warn-bg)]', total && '[&>td]:border-b-0 [&>th]:border-b-0')}>
        <th scope="row" className={cn('text-left', total ? 'font-semibold' : 'font-medium')}>
          {name}
        </th>
        <td className="text-right font-semibold tabular-nums">{formatMark(teacher, bn)}</td>
        <td className="text-right font-semibold tabular-nums">{formatMark(guardian, bn)}</td>
        <td className={cn('whitespace-nowrap text-right font-semibold tabular-nums', wide && 'text-warning')}>{gap === null ? '—' : `${wide ? '⚠ ' : ''}${bn(gap.toFixed(1))}`}</td>
      </tr>
    );
  };
  return (
    <div className="flex flex-col gap-2.5">
      <table className={TABLE} aria-label="তুলনা · শিক্ষক বনাম অভিভাবক">
        <thead>
          <tr className={HEAD}>
            <th scope="col" className="text-left">
              ক্ষেত্র
            </th>
            <th scope="col" className="w-20 text-right">
              শিক্ষক
            </th>
            <th scope="col" className="w-20 text-right">
              অভিভাবক
            </th>
            <th scope="col" className="w-20 text-right">
              পার্থক্য
            </th>
          </tr>
        </thead>
        <tbody>{compared.map((a) => row(a.name, a.teacher, a.guardian, a.guardian !== null && a.teacher !== null ? Math.abs(a.guardian - a.teacher) : null))}</tbody>
        <tfoot>{row('গড়', teacherTotal, shared?.guardian ?? null, shared ? Math.abs(shared.gap) : null, true)}</tfoot>
      </table>
      <p className={MUTED}>
        ⚠ = {bn(FLAGS.guardianTeacherGap)} মার্ক বা বেশি পার্থক্য
        {guardianOnly.length > 0 && ` · শুধু অভিভাবক: ${guardianOnly.map((a) => `${a.name} ${formatMark(a.guardian, bn)}`).join(', ')}`}
        {teacherOnly.length > 0 && ` · শুধু শিক্ষক: ${teacherOnly.map((a) => `${a.name} ${formatMark(a.teacher, bn)}${GUARDIAN_AREAS.has(a.key) ? ' (শিক্ষার্থীর গড়ে ধরা হয়নি)' : ''}`).join(', ')}`}
      </p>
    </div>
  );
}

/** Question × subject marks from the teachers; `columns` picks the subjects (all, or a print part). */
export function TeacherTable({ data, columns, label }: { data: StudentPage; columns: Grid; label: string }) {
  const { t1Questions, childQuestion } = data;
  return (
    <table className={cn(TABLE, 'sv-answers')} aria-label={label}>
      <thead>
        <tr className={HEAD}>
          <th scope="col" className="text-left">
            প্রশ্ন
          </th>
          {columns.map((row, i) => (
            <th key={i} scope="col" className="w-[76px] text-center leading-snug !text-foreground">
              {row.subject}
              <span className="block text-[12px] font-normal text-muted-foreground">{row.teacher || 'জমা হয়নি'}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {t1Questions.map((q, qi) => (
          <tr key={q.key} className={ROW}>
            <th scope="row" className="text-left">
              {q.text}
              <Hint text={childQuestion[qi] ? q.hint : [q.hint, 'অভিভাবক সম্পর্কে · শিক্ষার্থীর গড়ে ধরা হয় না'].filter(Boolean).join(' · ')} />
            </th>
            {columns.map((row, i) => (
              <td key={i} className="text-center">
                <MarkChip mark={row.marks ? row.marks[qi] : null} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="[&>td]:px-2.5 [&>td]:pt-2 [&>th]:px-2.5 [&>th]:pt-2">
          <th scope="row" className="text-left font-semibold">
            গড়
            <Hint text="অভিভাবক সম্পর্কে প্রশ্নগুলো বাদে" />
          </th>
          {columns.map((row, i) => (
            <td key={i} className="text-center">
              <MarkChip mark={row.marks ? average(row.marks.filter((_, qi) => childQuestion[qi])) : null} average />
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  );
}

/** Phones: one block per subject with marks, then the subjects still missing in one line. */
export function TeacherBlocks({ data }: { data: StudentPage }) {
  const { report, t1Questions, childQuestion, teacherMissing } = data;
  return (
    <div className="flex flex-col gap-3">
      {report.grid
        .filter((row) => row.marks)
        .map((row, i) => (
          <SubjectBlock
            key={i}
            title={row.subject}
            sub={row.teacher}
            items={t1Questions.map((q, qi) => ({ key: q.key, text: q.text, mark: row.marks![qi] }))}
            mean={average(row.marks!.filter((_, qi) => childQuestion[qi]))}
            meanNote="অভিভাবক সম্পর্কে প্রশ্নগুলো বাদে"
          />
        ))}
      {teacherMissing.length > 0 && <p className={MUTED}>জমা হয়নি: {teacherMissing.join(', ')}</p>}
    </div>
  );
}

function SubjectBlock({ title, sub, items, mean, meanNote }: { title: string; sub?: string | null; items: { key: string; text: string; mark: number | null | 'na' }[]; mean: number | null; meanNote?: string }) {
  return (
    <section className="rounded-lg border">
      <h4 className="m-0 flex items-baseline justify-between gap-2 border-b bg-muted/50 px-3 py-2 text-sm font-semibold">
        {title}
        {sub && <span className="text-[12.5px] font-normal text-muted-foreground">{sub}</span>}
      </h4>
      <ul className="m-0 list-none p-0">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 border-b px-3 py-2 text-[13.5px]">
            <span>{item.text}</span>
            {item.mark === 'na' ? <span className="shrink-0 text-[12.5px] text-muted-foreground">প্রযোজ্য নয়</span> : <MarkChip mark={item.mark} />}
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 px-3 py-2 text-[13.5px] font-semibold">
          <span>
            গড়
            <Hint text={meanNote} />
          </span>
          <MarkChip mark={mean} average />
        </li>
      </ul>
    </section>
  );
}

/** The guardian about the child: question, the chosen answer, its mark. */
export function GuardianTable({ data }: { data: StudentPage }) {
  const { guardian } = data;
  return (
    <table className={TABLE} aria-label="অভিভাবকের উত্তর · শিক্ষার্থী সম্পর্কে">
      <thead>
        <tr className={HEAD}>
          <th scope="col" className="text-left">
            প্রশ্ন
          </th>
          <th scope="col" className="text-left">
            উত্তর
          </th>
          <th scope="col" className="w-20 text-right">
            মার্ক
          </th>
        </tr>
      </thead>
      <tbody>
        {guardian.answers.map((a) => (
          <tr key={a.label} className={ROW}>
            <th scope="row" className="text-left font-normal">
              {a.question}
            </th>
            <td className="font-semibold">{a.answer ?? '—'}</td>
            <td className="text-right">{a.unscored ? <span className="text-[12.5px] text-muted-foreground">মার্ক নেই</span> : <MarkChip mark={a.mark} />}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="[&>td]:px-2.5 [&>td]:pt-2 [&>th]:px-2.5 [&>th]:pt-2">
          <th scope="row" colSpan={2} className="text-left font-semibold">
            গড়
            <Hint text="মার্কহীন উত্তর বাদে" />
          </th>
          <td className="text-right">
            <MarkChip mark={guardian.mean} average />
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

type Subject = { key: string; name: string };

/** The guardian on class management: question × subject marks; `subjects` picks the columns. */
export function ClassManagementTable({ data, subjects, label }: { data: StudentPage; subjects: Subject[]; label: string }) {
  const { guardian } = data;
  return (
    <table className={cn(TABLE, 'sv-answers')} aria-label={label}>
      <thead>
        <tr className={HEAD}>
          <th scope="col" className="text-left">
            প্রশ্ন
          </th>
          {subjects.map((s) => (
            <th key={s.key} scope="col" className="w-[76px] text-center !text-foreground">
              {s.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {guardian.g1Answers.map((q, qi) => (
          <tr key={qi} className={ROW}>
            <th scope="row" className="text-left">
              {q.question}
              <Hint text={q.hint} />
            </th>
            {subjects.map((s) => {
              const mark = q.marks.get(s.key);
              return (
                <td key={s.key} className="text-center">
                  {mark === 'na' ? <span className="text-[12.5px] text-muted-foreground">প্রযোজ্য নয়</span> : <MarkChip mark={mark ?? null} />}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="[&>td]:px-2.5 [&>td]:pt-2 [&>th]:px-2.5 [&>th]:pt-2">
          <th scope="row" className="text-left font-semibold">
            গড়
          </th>
          {subjects.map((s) => (
            <td key={s.key} className="text-center">
              <MarkChip mark={data.g1Averages.find((a) => a.key === s.key)?.mean ?? null} average />
            </td>
          ))}
        </tr>
      </tfoot>
    </table>
  );
}

/** Phones: the class-management answers, one block per subject. */
export function ClassManagementBlocks({ data }: { data: StudentPage }) {
  const { guardian, g1Averages } = data;
  return (
    <div className="flex flex-col gap-3">
      {g1Averages.map((s) => (
        <SubjectBlock key={s.key} title={s.name} items={guardian.g1Answers.map((q, qi) => ({ key: String(qi), text: q.question, mark: q.marks.get(s.key) ?? null }))} mean={s.mean} />
      ))}
    </div>
  );
}

export function FormLine({ form, label }: { form: { who: string | null; relation: string | null; submittedAt: Date | null; verified: boolean | null }; label: string }) {
  return (
    <p className={MUTED}>
      {label} · {form.who}
      {form.relation ? ` (${form.relation})` : ''}
      {form.submittedAt ? ` · ${formatDateTime(form.submittedAt)}` : ''} · <b className={cn('font-semibold', form.verified ? 'text-success' : 'text-warning')}>{form.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}</b>
    </p>
  );
}

/** A teacher's note or a guardian's comment, under a small line saying whose. */
export function Quote({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <div className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-[14.5px] leading-relaxed">
      <span className="block text-[13px] text-muted-foreground">{label}</span>
      {text}
    </div>
  );
}

const STATUS = {
  current: { label: 'বর্তমান', tone: 'text-success' },
  duplicate: { label: 'ডুপ্লিকেট', tone: 'text-warning' },
  superseded: { label: 'পুরনো', tone: 'text-muted-foreground' },
  'set-aside': { label: 'বাদ (অ্যাডমিন সিদ্ধান্ত)', tone: 'text-muted-foreground' },
} as const;

/** Every submission for this child: guardians' forms, then the teachers' batches. */
export function History({ data }: { data: StudentPage }) {
  const { guardian, report } = data;
  const entries = [
    ...guardian.log.map((entry) => ({
      kind: KIND_LABEL[entry.kind as keyof typeof KIND_LABEL],
      who: submittedBy(entry),
      when: `${entry.roundLabel}${entry.submittedAt ? ` · ${formatDateTime(entry.submittedAt)}` : ''} · ${entry.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}`,
      status: (entry.supersededBy ? 'superseded' : 'current') as keyof typeof STATUS,
    })),
    ...report.log.map((entry) => ({
      kind: KIND_LABEL.T1,
      who: `${entry.teacherName} · ${entry.subjectName}`,
      when: `${entry.roundLabel}${entry.submittedAt ? ` · ${formatDateTime(entry.submittedAt)}` : ''}`,
      status: entry.status as keyof typeof STATUS,
    })),
  ];
  if (!entries.length) return <p className={MUTED}>এখনো কোনো জমা নেই।</p>;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {entries.map((e, i) => (
        <li key={i} className={cn('flex items-start gap-3 border-b py-2.5 text-sm last:border-b-0', (e.status === 'superseded' || e.status === 'set-aside') && 'opacity-70')}>
          <span className="inline-flex h-[22px] shrink-0 items-center rounded-md border px-2 text-xs font-medium">{e.kind}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{e.who}</span>
            <span className="block text-[13px] text-muted-foreground">{e.when}</span>
          </span>
          <span className={cn('shrink-0 text-[13px] font-semibold', STATUS[e.status].tone)}>{STATUS[e.status].label}</span>
        </li>
      ))}
    </ul>
  );
}

export const historyCount = (data: StudentPage) => data.guardian.log.length + data.report.log.length;
