import type { Metadata } from 'next';
import Link from 'next/link';
import { z } from 'zod';
import { adminCycle, receiptApplications, receiptTargets } from '@/lib/admissions/admin';
import { MAX_RECEIPTS } from '@/lib/admissions/admin-labels';
import { toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { schoolInfo } from '@/lib/admissions/pdf';
import { PageTop } from '../../AdminShell';
import { EmptyState, LINK, PageBody } from '../../ui';
import { NoCycle, classLabelOf, listQuery, listSearchParams, type ListSearch } from '../ListPage';
import { PrintReceiptButton, ReceiptPrint } from '../ReceiptPrint';
import { ReceiptLogoStyle, ReceiptPrintNote, ReceiptSheet, receiptDay } from '../ReceiptSheet';

export const metadata: Metadata = { title: 'অ্যাসেসমেন্ট ফি-র রসিদ' };
export const dynamic = 'force-dynamic';

// Receipts printed in bulk ahead of assessment day: the applications ticked in the list (?ids=),
// or every one matching the list's filters, tests left out. This page only shows them: numbers
// are given when the print button is pressed, to the sheets on the page (ReceiptPrint).

const uuid = z.uuid();

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<ListSearch & { ids?: string }> }) {
  const search = await searchParams;
  const school = schoolInfo();
  const cycle = await adminCycle();
  if (!cycle) return <NoCycle />;
  const filters = listSearchParams(search).toString();
  const listHref = `/admin/admissions/applications${filters ? `?${filters}` : ''}`;
  const crumbs = [{ label: 'ভর্তি', href: '/admin/admissions' }, { label: 'আবেদন', href: listHref }, { label: 'ফি-র রসিদ' }];
  const { classes, params } = await listQuery(cycle, 'paid', search);

  let ids: string[];
  let total: number;
  if (search.ids) {
    ids = [...new Set(search.ids.split(','))].filter((id) => uuid.safeParse(id).success);
    total = ids.length;
  } else {
    ({ ids, total } = await receiptTargets(cycle.cycleId, params, MAX_RECEIPTS));
  }
  const empty = (message: string, link: string) => (
    <>
      <PageTop crumbs={crumbs} round={false} />
      <PageBody>
        <EmptyState>
          {message}{' '}
          <Link href={listHref} className={LINK}>
            {link}
          </Link>
        </EmptyState>
      </PageBody>
    </>
  );
  if (total > MAX_RECEIPTS) return empty(`একসাথে সর্বোচ্চ ${bn(MAX_RECEIPTS)}টি রসিদ প্রিন্ট করা যায়।`, 'তালিকায় শ্রেণী বা অবস্থা দিয়ে ফিল্টার করুন');

  const apps = await receiptApplications(cycle.cycleId, ids, classes.map((c) => c.value));
  const sheets = apps.filter((a) => !a.isTest);
  if (!sheets.length) return empty('কোনো রসিদ নেই।', 'তালিকায় ফিরুন');
  const printed = sheets.filter((a) => a.evalReceiptPrintedAt).map((a) => a.id);
  const unnumbered = sheets.filter((a) => !a.evalReceiptNo).length;
  const today = receiptDay(new Date());
  const info = await school;

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
            {unnumbered > 0 && <> প্রিন্ট বোতাম চাপলে {bn(unnumbered)}টি রসিদে নম্বর দেওয়া হবে।</>}
            {printed.length > 0 && <> আগে প্রিন্ট হয়েছে {bn(printed.length)}টি: সেগুলো ডুপ্লিকেট হিসেবে ছাপা হবে।</>}
            {apps.length > sheets.length && <> পরীক্ষামূলক আবেদন {bn(apps.length - sheets.length)}টি বাদ।</>}
          </p>
        </div>
      </div>
      <ReceiptLogoStyle school={info} />
      <ReceiptPrintNote />
      <div className="flex flex-col">
        {sheets.map((app) => (
          <ReceiptSheet
            key={app.id}
            app={app}
            session={cycle.session}
            fee={cycle.snapshot.settings.evaluationFee}
            classLabel={classLabelOf(classes, app.classValue)}
            school={info}
            today={today}
          />
        ))}
      </div>
    </ReceiptPrint>
  );
}
