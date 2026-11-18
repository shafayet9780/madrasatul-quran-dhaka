import type { Metadata } from 'next';
import Link from 'next/link';
import { adminCycle, assignEvalReceipts, listApplications, receiptApplications } from '@/lib/admissions/admin';
import { MAX_RECEIPTS } from '@/lib/admissions/admin-labels';
import { toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { schoolInfo } from '@/lib/admissions/pdf';
import { PageTop } from '../../AdminShell';
import { EmptyState, LINK, PageBody } from '../../ui';
import { NoCycle, classOptions, listQuery, type ListSearch } from '../ListPage';
import { PrintReceiptButton, ReceiptPrint } from '../ReceiptPrint';
import { ReceiptLogoStyle, ReceiptSheet, receiptDay } from '../ReceiptSheet';

export const metadata: Metadata = { title: 'অ্যাসেসমেন্ট ফি-র রসিদ' };
export const dynamic = 'force-dynamic';

// Receipts printed in bulk ahead of assessment day: the applications ticked in the list (?ids=),
// or every one matching the list's filters. Opening this page gives each application without a
// number the next receipt number (class and ID order); a sheet already printed comes out ডুপ্লিকেট.
// Test applications are left out.

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<ListSearch & { ids?: string }> }) {
  const search = await searchParams;
  const cycle = await adminCycle();
  if (!cycle) return <NoCycle />;
  const { ids: picked, ...filters } = search;
  const listHref = `/admin/admissions/applications?${new URLSearchParams(Object.entries(filters).filter(([k, v]) => v && k !== 'page' && k !== 'deleted') as [string, string][])}`;
  const crumbs = [{ label: 'ভর্তি', href: '/admin/admissions' }, { label: 'আবেদন', href: listHref }, { label: 'ফি-র রসিদ' }];

  let ids: string[];
  if (picked) {
    ids = picked.split(',').filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  } else {
    const { params } = await listQuery(cycle, 'paid', filters);
    const { rows } = await listApplications(cycle.cycleId, { ...params, pageSize: MAX_RECEIPTS + 1 });
    ids = rows.map((r) => r.id);
  }
  if (ids.length > MAX_RECEIPTS) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <EmptyState>
            একসাথে সর্বোচ্চ {bn(MAX_RECEIPTS)}টি রসিদ প্রিন্ট করা যায়।{' '}
            <Link href={listHref} className={LINK}>
              তালিকায় শ্রেণী বা অবস্থা দিয়ে ফিল্টার করুন
            </Link>
          </EmptyState>
        </PageBody>
      </>
    );
  }

  const classes = await classOptions(cycle);
  const classOrder = classes.map((c) => c.value);
  await assignEvalReceipts(cycle.cycleId, ids, classOrder);
  const [apps, school] = await Promise.all([receiptApplications(cycle.cycleId, ids, classOrder), schoolInfo()]);
  const sheets = apps.filter((a) => !a.isTest);
  if (!sheets.length) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <EmptyState>
            কোনো রসিদ নেই।{' '}
            <Link href={listHref} className={LINK}>
              তালিকায় ফিরুন
            </Link>
          </EmptyState>
        </PageBody>
      </>
    );
  }
  const printed = sheets.filter((a) => a.evalReceiptPrintedAt).map((a) => a.id);
  const today = receiptDay(new Date());

  return (
    <ReceiptPrint ids={sheets.map((a) => a.id)} printed={printed}>
      <PageTop crumbs={crumbs} round={false} />
      <div className="sv-no-print mt-4">
        <div className="flex max-w-[794px] flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[15px] font-semibold">{bn(sheets.length)}টি রসিদ</span>
            <PrintReceiptButton label="সব রসিদ প্রিন্ট করুন" />
          </div>
          <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
            প্রতিটি আবেদনের জন্য এক পাতা A4, শ্রেণী ও আইডি অনুযায়ী সাজানো। ওপরের অংশ অফিসের, নিচের অংশ কেটে অভিভাবককে দিন। ফি নেওয়ার সময় তারিখ লিখে স্বাক্ষর ও সিল দিন, তারপর আবেদনের পেজে ফি গৃহীত চিহ্নিত করুন।
            {printed.length > 0 && <> আগে প্রিন্ট হয়েছে {bn(printed.length)}টি: সেগুলো ডুপ্লিকেট হিসেবে ছাপা হবে।</>}
            {apps.length > sheets.length && <> পরীক্ষামূলক আবেদন {bn(apps.length - sheets.length)}টি বাদ।</>}
          </p>
        </div>
      </div>
      <ReceiptLogoStyle school={school} />
      <div className="flex flex-col">
        {sheets.map((app) => (
          <ReceiptSheet
            key={app.id}
            app={app}
            session={cycle.session}
            fee={cycle.snapshot.settings.evaluationFee}
            classLabel={classes.find((c) => c.optionValue === app.classValue)?.label ?? ''}
            school={school}
            today={today}
          />
        ))}
      </div>
    </ReceiptPrint>
  );
}
