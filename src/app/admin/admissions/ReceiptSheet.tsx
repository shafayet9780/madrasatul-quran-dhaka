import type { Application } from '@/lib/admissions/drafts';
import { evalReceiptRef } from '@/lib/admissions/admin-labels';
import { dateTime, taka } from '@/lib/admissions/display';
import { formatMobile, toBengaliDigits as bn } from '@/lib/admissions/normalise';
import type { schoolInfo } from '@/lib/admissions/pdf';
import { DuplicateMark, ReceiptNumber } from './ReceiptPrint';

// The assessment fee receipt: one A4 sheet cut in half, the office's copy on top and the guardian's
// below. Printed in advance (fee not received yet) it has a blank date line and no পরিশোধিত stamp:
// the office writes the date and signs when the cash is taken.

/** "১৮ নভেম্বর ২০২৬" (Dhaka date). */
export const receiptDay = (d: Date) => new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(d);
const time = (d: Date) => dateTime(d.toISOString(), 'bengali').split(', ')[1];

type School = Awaited<ReturnType<typeof schoolInfo>>;

/** The school logo once per page (a sheet per application would repeat the image hundreds of times). */
export function ReceiptLogoStyle({ school }: { school: School }) {
  if (!school.logo) return null;
  return <style>{`.sv-admin .adm-receipt-logo{background-image:url("${school.logo}")}`}</style>;
}

/** Printed instead of the receipts when the page is printed without its button (Ctrl+P): see admin.css. */
export function ReceiptPrintNote() {
  return <p className="adm-receipt-note">রসিদ প্রিন্ট করতে পেজের “রসিদ প্রিন্ট করুন” বোতাম ব্যবহার করুন: বোতাম রসিদ নম্বর দেয় ও প্রিন্টের হিসাব রাখে।</p>;
}

export function ReceiptSheet({ app, session, fee, classLabel, school, today }: { app: Application; session: string; fee: number; classLabel: string; school: School; today: string }) {
  const receiptNo = app.evalReceiptNo ? evalReceiptRef(session, app.evalReceiptNo) : null;
  // The date of the first print with the fee received stays, even if the fee is switched off and on.
  const received = app.evalFeeReceivedAt ? (app.evalReceiptDate ?? app.evalFeeReceivedAt) : null;
  const rows: [string, string, boolean?][] = [
    ['আবেদন আইডি', app.publicRef ?? '', true],
    ['আবেদিত শ্রেণী', classLabel],
    ['শিক্ষার্থীর নাম', [app.studentNameBn, app.studentNameEn && `(${app.studentNameEn})`].filter(Boolean).join(' ')],
    ['পিতার নাম', app.fatherName ?? ''],
    ['মোবাইল', formatMobile(app.primaryMobile), true],
  ];

  const half = (copy: string) => (
    <section className="adm-receipt-half">
      <header className="adm-receipt-head">
        {school.logo && <span className="adm-receipt-logo" aria-hidden />}
        <div className="min-w-0 flex-1">
          <div className="adm-receipt-school">{school.name}</div>
          {school.line && <div className="adm-receipt-muted">{school.line}</div>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="adm-receipt-copy">{copy}</span>
          <DuplicateMark id={app.id} on={today} />
        </div>
      </header>
      <h2 className="adm-receipt-title">
        অ্যাসেসমেন্ট ফি-র রসিদ <span className="adm-receipt-muted">· প্রি-অ্যাডমিশন {bn(session)}</span>
      </h2>
      <div className="adm-receipt-meta">
        <span>
          রসিদ নং <ReceiptNumber id={app.id} number={receiptNo} test={app.isTest} />
        </span>
        {received ? (
          <span>
            তারিখ <b>{receiptDay(received)}</b>, {time(received)}
          </span>
        ) : (
          <span className="flex items-end gap-1.5">
            তারিখ <i className="adm-receipt-line" />
          </span>
        )}
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
          <b>{taka(fee, 'bengali')}</b>
          {received && <span className="adm-receipt-stamp">পরিশোধিত</span>}
        </span>
      </div>
      <div className="adm-receipt-sign">
        <span>গ্রহণকারীর স্বাক্ষর ও সিল</span>
      </div>
    </section>
  );

  return (
    <article className="adm-receipt" aria-label={`অ্যাসেসমেন্ট ফি-র রসিদ, ${app.publicRef}`}>
      {half('অফিস কপি')}
      <div className="adm-receipt-cut" aria-hidden>
        <span>✂ এখানে কেটে নিচের অংশ অভিভাবককে দিন</span>
      </div>
      {half('অভিভাবকের কপি')}
    </article>
  );
}
