import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { applicationDetail } from '@/lib/admissions/admin';
import { schoolInfo } from '@/lib/admissions/pdf';
import { PageTop } from '../../../AdminShell';
import { EmptyState, LINK, PageBody } from '../../../ui';
import { classLabelOf, classOptions } from '../../ListPage';
import { PrintReceiptButton, ReceiptPrint } from '../../ReceiptPrint';
import { ReceiptLogoStyle, ReceiptPrintNote, ReceiptSheet, receiptDay } from '../../ReceiptSheet';

export const metadata: Metadata = { title: 'অ্যাসেসমেন্ট ফি-র রসিদ' };
export const dynamic = 'force-dynamic';

// One application's receipt: fee received, or a number given when receipts were printed in
// advance. The session, fee and classes are the application's own (an older cycle stays as it was).

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = schoolInfo();
  const detail = await applicationDetail(id);
  if (!detail?.app.publicRef) notFound();
  const { app, snapshot } = detail;
  const crumbs = [{ label: 'ভর্তি', href: '/admin/admissions' }, { label: app.publicRef!, href: `/admin/admissions/${app.id}` }, { label: 'রসিদ' }];

  if (!app.evalFeeReceivedAt && !app.evalReceiptNo) {
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

  const session = snapshot.settings.session;
  const classes = await classOptions({ cycleId: app.cycleId, session, snapshot });
  return (
    <ReceiptPrint ids={[app.id]} printed={app.evalReceiptPrintedAt ? [app.id] : []}>
      <PageTop crumbs={crumbs} round={false} />
      {/* In the page, not the top bar: phones hide top-bar actions, and assessment day is worked on phones. */}
      <div className="sv-no-print mt-4">
        <div className="flex max-w-[794px] flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-muted-foreground">এক পাতা A4: ওপরের অংশ অফিসের, নিচের অংশ কেটে অভিভাবককে দিন।</span>
          <PrintReceiptButton />
        </div>
      </div>
      <ReceiptLogoStyle school={await school} />
      <ReceiptPrintNote />
      <ReceiptSheet app={app} session={session} fee={snapshot.settings.evaluationFee} classLabel={classLabelOf(classes, app.classValue)} school={await school} today={receiptDay(new Date())} />
    </ReceiptPrint>
  );
}
