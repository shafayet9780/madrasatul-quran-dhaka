import type { Metadata } from 'next';
import Link from 'next/link';
import { adminCycle, attendedToday } from '@/lib/admissions/admin';
import { dateTime, taka } from '@/lib/admissions/display';
import { toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { NoCycle } from '../ListPage';
import { Card, LAT, PageBody, PageTitle } from '../../ui';
import { CheckInForm } from './CheckInForm';

export const metadata: Metadata = { title: 'মূল্যায়নের দিন' };
export const dynamic = 'force-dynamic';

const time = (d: Date) => dateTime(d.toISOString(), 'bengali').split(', ')[1];

export default async function EvaluationDayPage() {
  const cycle = await adminCycle();
  if (!cycle) return <NoCycle />;
  const today = await attendedToday(cycle.cycleId);
  const fees = today.filter((t) => t.evalFeeReceivedAt).length;
  return (
    <>
      <PageTop crumbs={[{ label: 'ভর্তি', href: '/admin/admissions' }, { label: 'মূল্যায়নের দিন' }]} round={false} />
      <PageBody className="gap-5">
        <PageTitle sub={`আবেদনপত্রের “অফিস ব্যবহারের জন্য” QR ফোনের ক্যামেরায় স্ক্যান করলে সরাসরি আবেদনটি খোলে। না হলে নিচে আইডি লিখুন। আবেদনের পাতায় উপস্থিতি ও মূল্যায়ন ফি ${taka(cycle.snapshot.settings.evaluationFee, 'bengali')} চিহ্নিত করুন।`}>
          মূল্যায়নের দিন
        </PageTitle>
        <div className="flex flex-wrap items-start gap-5">
          <Card className="flex-[1_1_320px]">
            <CheckInForm />
          </Card>
          <Card className="flex-[2_1_420px]" title={`আজ উপস্থিত: ${bn(today.length)} জন`} action={<span className="text-[13px] text-muted-foreground">মূল্যায়ন ফি গৃহীত {bn(fees)}টি</span>}>
            {today.length ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:text-left [&>th]:text-[13px] [&>th]:font-medium [&>th]:text-muted-foreground">
                    <th>আইডি</th>
                    <th>শিক্ষার্থী</th>
                    <th>উপস্থিত</th>
                    <th>মূল্যায়ন ফি</th>
                  </tr>
                </thead>
                <tbody>
                  {today.map((t) => (
                    <tr key={t.id} className="[&>td]:border-b [&>td]:py-2.5 [&>td]:pr-3 last:[&>td]:border-b-0">
                      <td className={cn(LAT, 'font-medium')}>
                        <Link href={`/admin/admissions/${t.id}?from=evaluation-day`} className="text-foreground no-underline hover:underline">
                          {t.publicRef}
                        </Link>
                      </td>
                      <td>{t.studentNameBn}</td>
                      <td className="text-muted-foreground">{t.attendedAt ? time(t.attendedAt) : ''}</td>
                      <td className={t.evalFeeReceivedAt ? 'text-success' : 'text-muted-foreground'}>{t.evalFeeReceivedAt ? 'গৃহীত' : 'বাকি'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="m-0 text-sm text-muted-foreground">আজ এখনো কাউকে উপস্থিত চিহ্নিত করা হয়নি।</p>
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}
