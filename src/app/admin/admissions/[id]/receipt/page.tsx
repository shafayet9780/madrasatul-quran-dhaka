import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminCycle, applicationDetail } from '@/lib/admissions/admin';
import { schoolInfo } from '@/lib/admissions/pdf';
import { PageTop } from '../../../AdminShell';
import { EmptyState, LINK, PageBody } from '../../../ui';
import { classOptions } from '../../ListPage';
import { PrintReceiptButton, ReceiptPrint } from '../../ReceiptPrint';
import { ReceiptLogoStyle, ReceiptSheet, receiptDay } from '../../ReceiptSheet';

export const metadata: Metadata = { title: 'অ্যাসেসমেন্ট ফি-র রসিদ' };
export const dynamic = 'force-dynamic';

// One application's receipt (fee received, or a number given when receipts were printed in advance).

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, cycle] = await Promise.all([applicationDetail(id), adminCycle()]);
  if (!detail?.app.publicRef || !cycle) notFound();
  const { app } = detail;
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

  const [school, classes] = await Promise.all([schoolInfo(), classOptions(cycle)]);
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
      <ReceiptLogoStyle school={school} />
      <ReceiptSheet
        app={app}
        session={cycle.session}
        fee={cycle.snapshot.settings.evaluationFee}
        classLabel={classes.find((c) => c.optionValue === app.classValue)?.label ?? ''}
        school={school}
        today={receiptDay(new Date())}
      />
    </ReceiptPrint>
  );
}
