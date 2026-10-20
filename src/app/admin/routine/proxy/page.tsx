import type { Metadata } from 'next';
import { proxyDay } from '@/lib/routine/data';
import { dateText, dhakaToday, isDate } from '@/lib/routine/days';
import { PageTop } from '../../AdminShell';
import { PageBody, PageTitle } from '../../ui';
import { NoRoutine, routineSub } from '../ui';
import { ProxyBoard } from './ProxyBoard';

export const metadata: Metadata = { title: 'প্রক্সি' };
export const dynamic = 'force-dynamic';

export default async function ProxyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const asked = (await searchParams).date;
  const date = isDate(asked) ? asked : dhakaToday();
  const day = await proxyDay(date);
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'প্রক্সি' }]} round={false} />
      <PageBody>
        <PageTitle sub={day.data ? routineSub(day.data.routine, dateText(date)) : dateText(date)}>প্রক্সি</PageTitle>
        {day.data ? <ProxyBoard date={date} day={{ ...day, data: day.data }} /> : <NoRoutine>কোনো রুটিন চালু নেই।</NoRoutine>}
      </PageBody>
    </>
  );
}
