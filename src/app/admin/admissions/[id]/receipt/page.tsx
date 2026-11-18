import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { applicationDetail } from '@/lib/admissions/admin';
import { evalReceiptRef } from '@/lib/admissions/admin-labels';
import { dateTime, taka, txt } from '@/lib/admissions/display';
import { fieldWithRole } from '@/lib/admissions/form-config';
import { formatMobile, toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { schoolInfo } from '@/lib/admissions/pdf';
import { PageTop } from '../../../AdminShell';
import { EmptyState, LINK, PageBody } from '../../../ui';
import { DuplicateMark, PrintReceiptButton, ReceiptPrint } from './ReceiptPrint';

export const metadata: Metadata = { title: 'অ্যাসেসমেন্ট ফি-র রসিদ' };
export const dynamic = 'force-dynamic';

// The assessment fee receipt: one A4 sheet cut in half, the office's copy on top and the guardian's
// below. The number is given when the fee is marked received; a reprint says ডুপ্লিকেট.

/** "১৮ নভেম্বর ২০২৬" (Dhaka date). */
const day = (d: Date) => new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(d);
const time = (d: Date) => dateTime(d.toISOString(), 'bengali').split(', ')[1];

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await applicationDetail(id);
  if (!detail?.app.publicRef) notFound();
  const { app, snapshot } = detail;
  const crumbs = [{ label: 'ভর্তি', href: '/admin/admissions' }, { label: app.publicRef!, href: `/admin/admissions/${app.id}` }, { label: 'রসিদ' }];

  if (!app.evalFeeReceivedAt) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <EmptyState>
            অ্যাসেসমেন্ট ফি এখনো গৃহীত চিহ্নিত হয়নি।{' '}
            <Link href={`/admin/admissions/${app.id}`} className={LINK}>
              আবেদনের পেজে চিহ্নিত করুন
            </Link>
          </EmptyState>
        </PageBody>
      </>
    );
  }

  const classField = fieldWithRole(snapshot, 'classApplied');
  const classLabel = txt([...(classField?.options ?? []), ...(classField?.closedOptions ?? [])].find((o) => o.value === app.classValue)?.label, 'bengali');
  const session = snapshot.settings.session;
  const school = await schoolInfo();
  const receiptNo = app.evalReceiptNo ? bn(evalReceiptRef(session, app.evalReceiptNo)) : null;
  const received = app.evalFeeReceivedAt;
  const rows: [string, string, boolean?][] = [
    ['আবেদন আইডি', app.publicRef!, true],
    ['আবেদিত শ্রেণী', classLabel],
    ['শিক্ষার্থীর নাম', [app.studentNameBn, app.studentNameEn && `(${app.studentNameEn})`].filter(Boolean).join(' ')],
    ['পিতার নাম', app.fatherName ?? ''],
    ['মোবাইল', formatMobile(app.primaryMobile), true],
  ];

  const half = (copy: string) => (
    <section className="adm-receipt-half">
      <header className="adm-receipt-head">
        {school.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logo} alt="" className="adm-receipt-logo" />
        )}
        <div className="min-w-0 flex-1">
          <div className="adm-receipt-school">{school.name}</div>
          {school.line && <div className="adm-receipt-muted">{school.line}</div>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="adm-receipt-copy">{copy}</span>
          <DuplicateMark on={day(new Date())} />
        </div>
      </header>
      <h2 className="adm-receipt-title">
        অ্যাসেসমেন্ট ফি-র রসিদ <span className="adm-receipt-muted">· প্রি-অ্যাডমিশন {bn(session)}</span>
      </h2>
      <div className="adm-receipt-meta">
        <span>
          রসিদ নং <b>{receiptNo ?? (app.isTest ? 'পরীক্ষামূলক আবেদন, নম্বর নেই' : '—')}</b>
        </span>
        <span>
          তারিখ <b>{day(received)}</b>, {time(received)}
        </span>
      </div>
      <dl className="adm-receipt-rows">
        {rows.map(([label, value, latin]) => (
          <div key={label} className="contents">
            <dt>{label}</dt>
            <dd className={latin ? 'adm-receipt-lat' : undefined}>{value || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="adm-receipt-amount">
        <span>অ্যাসেসমেন্ট ফি (নগদ)</span>
        <span className="flex items-center gap-3">
          <b>{taka(snapshot.settings.evaluationFee, 'bengali')}</b>
          <span className="adm-receipt-stamp">পরিশোধিত</span>
        </span>
      </div>
      <div className="adm-receipt-sign">
        <span>গ্রহণকারীর স্বাক্ষর ও সিল</span>
      </div>
    </section>
  );

  return (
    <ReceiptPrint id={app.id} duplicate={!!app.evalReceiptPrintedAt}>
      <PageTop crumbs={crumbs} round={false} />
      {/* In the page, not the top bar: phones hide top-bar actions, and assessment day is worked on phones. */}
      <div className="sv-no-print mt-4 flex max-w-[794px] flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">এক পাতা A4: ওপরের অংশ অফিসের, নিচের অংশ কেটে অভিভাবককে দিন।</span>
        <PrintReceiptButton />
      </div>
      <article className="adm-receipt" aria-label="অ্যাসেসমেন্ট ফি-র রসিদ">
        {half('অফিস কপি')}
        <div className="adm-receipt-cut" aria-hidden>
          <span>✂ এখানে কেটে নিচের অংশ অভিভাবককে দিন</span>
        </div>
        {half('অভিভাবকের কপি')}
      </article>
    </ReceiptPrint>
  );
}
