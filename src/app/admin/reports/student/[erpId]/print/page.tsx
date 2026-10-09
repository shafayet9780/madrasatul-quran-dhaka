import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate, formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { NoRounds } from '../../../NoRounds';
import { ReportTools } from '../../../ReportTools';
import { PageTop } from '../../../../AdminShell';
import { EmptyState, LINK, PageBody } from '../../../../ui';
import { studentPageData } from '../data';
import { AttentionList, ClassManagementTable, CompareTable, FormLine, GuardianTable, History, MarkLegend, MUTED, Quote, TeacherTable } from '../parts';

export const metadata: Metadata = { title: 'অভ্যন্তরীণ প্রতিবেদন' };
export const dynamic = 'force-dynamic';

// The internal print (A4, portrait): all three reviews with teachers' names and notes, and every
// submission. Sections may break across pages; table rows and headings do not. Wide tables are
// split into parts of PART subjects that repeat the question column, so nothing runs off the page.

const PART = 6;
const parts = <T,>(list: T[]) => Array.from({ length: Math.ceil(list.length / PART) }, (_, i) => list.slice(i * PART, (i + 1) * PART));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="m-0 border-b pb-1.5 text-[17px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function InternalPrintPage({ params, searchParams }: { params: Promise<{ erpId: string }>; searchParams: Promise<{ round?: string }> }) {
  const [{ erpId }, search] = await Promise.all([params, searchParams]);
  const data = await studentPageData(erpId, search.round);
  if (!data.round) return <NoRounds />;
  if (!data.report) {
    return (
      <>
        <PageTop crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' }, { label: 'পাওয়া যায়নি' }]} />
        <PageBody>
          <EmptyState>
            শিক্ষার্থী পাওয়া যায়নি।{' '}
            <Link href={`/admin/reports?round=${data.round.id}`} className={LINK}>
              খুঁজুন
            </Link>
          </EmptyState>
        </PageBody>
      </>
    );
  }
  const { round, report, student, guardian, teacherMissing, father, mother } = data;
  const rated = report.grid.filter((row) => row.marks);

  return (
    <>
      <PageTop
        crumbs={[{ label: 'ক্লাস ও শিক্ষার্থী', href: '/admin/reports' }, { label: student.name, href: `/admin/reports/student/${encodeURIComponent(erpId)}?round=${round.id}` }, { label: 'অভ্যন্তরীণ প্রিন্ট' }]}
        actions={<ReportTools printLabel="প্রিন্ট / PDF" />}
      />
      <article className="adm sv-print-sheet is-long flex flex-col gap-6 text-foreground" aria-label="অভ্যন্তরীণ প্রতিবেদন">
        <header className="flex items-start justify-between gap-4 border-b-2 border-foreground pb-3">
          <div className="flex flex-col">
            <span className="text-lg font-semibold [font-family:var(--sv-font-head)]">মাদরাসাতুল কুরআন, ঢাকা</span>
            <span className="text-[13px] text-muted-foreground">শিক্ষার্থীর পূর্ণ প্রতিবেদন · অভ্যন্তরীণ, শুধু অফিসের জন্য</span>
          </div>
          <div className="text-right text-[13px] text-muted-foreground">
            {round.label} রাউন্ড
            <br />
            প্রস্তুত: {formatDate(new Date())}
          </div>
        </header>

        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-[26px] font-semibold leading-snug">{student.name}</h1>
          <p className={MUTED}>
            আইডি {bn(student.erpId)} · {student.label}
            {student.roll !== null ? ` · রোল ${bn(student.roll)}` : ''}
            {student.fatherName ? ` · পিতা: ${student.fatherName}` : ''}
            {[father && ` · বাবা ${father}`, mother && ` · মা ${mother}`].filter(Boolean).join('')}
          </p>
        </div>

        <Section title="মনোযোগ প্রয়োজন">
          <AttentionList data={data} />
        </Section>

        <Section title="তুলনা · শিক্ষক বনাম অভিভাবক">
          <p className={MUTED}>একই বিষয়ে দুই দিকের মার্ক, ১০-এর মধ্যে · শিক্ষক = সব বিষয়ের শিক্ষকের গড়</p>
          <CompareTable data={data} />
        </Section>

        <MarkLegend />

        <Section title="শিক্ষকদের উত্তর">
          {rated.length === 0 ? (
            <p className={MUTED}>এখনো কোনো শিক্ষক জমা দেননি।</p>
          ) : (
            parts(rated).map((columns, i, all) => <TeacherTable key={i} data={data} columns={columns} label={all.length > 1 ? `শিক্ষকদের উত্তর (${bn(i + 1)}/${bn(all.length)})` : 'শিক্ষকদের উত্তর'} />)
          )}
          {teacherMissing.length > 0 && <p className={MUTED}>জমা হয়নি: {teacherMissing.join(', ')}</p>}
          <h3 className="m-0 mt-1 text-[15px] font-semibold">শিক্ষকদের নোট</h3>
          {report.notes.length === 0 && <p className={MUTED}>কোনো নোট নেই।</p>}
          {report.notes.map((note, i) => (
            <Quote key={i} label={`${note.teacherName} · ${note.subjectName}${note.submittedAt ? ` · ${formatDateTime(note.submittedAt)}` : ''}`} text={note.note} />
          ))}
        </Section>

        <Section title="অভিভাবকের উত্তর · শিক্ষার্থী সম্পর্কে">
          {!guardian.g2 && <p className={MUTED}>এই রাউন্ডের সাথে অভিভাবকের রিভিউ নেই।</p>}
          {guardian.g2 && !guardian.form && <p className={MUTED}>অভিভাবক এখনো জমা দেননি।</p>}
          {guardian.g2 && guardian.form && (
            <>
              <FormLine form={guardian.form} label={guardian.g2.label} />
              <GuardianTable data={data} />
              <Quote label="মন্তব্য" text={guardian.form.comment} />
            </>
          )}
        </Section>

        <Section title="অভিভাবকের উত্তর · ক্লাস পরিচালনা">
          {!guardian.g1 && <p className={MUTED}>এই রাউন্ডের সাথে ক্লাস পরিচালনার রিভিউ নেই।</p>}
          {guardian.g1 && !guardian.g1Form && <p className={MUTED}>অভিভাবক এখনো জমা দেননি।</p>}
          {guardian.g1 && guardian.g1Form && (
            <>
              <FormLine form={guardian.g1Form} label={guardian.g1.label} />
              {parts(guardian.g1Subjects).map((subjects, i, all) => (
                <ClassManagementTable key={i} data={data} subjects={subjects} label={all.length > 1 ? `ক্লাস পরিচালনা (${bn(i + 1)}/${bn(all.length)})` : 'ক্লাস পরিচালনা'} />
              ))}
              <Quote label="মন্তব্য" text={guardian.g1Form.comment} />
            </>
          )}
        </Section>

        <Section title="সব জমা · ইতিহাস">
          <History data={data} />
        </Section>

        <footer className="border-t pt-2 text-center text-[12px] text-muted-foreground">অভ্যন্তরীণ প্রতিবেদন: শিক্ষকদের নাম ও নোটসহ। অভিভাবককে দেওয়ার জন্য “অভিভাবকের জন্য প্রিন্ট” ব্যবহার করুন।</footer>
      </article>
    </>
  );
}
