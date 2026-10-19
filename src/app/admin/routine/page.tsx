import type { Metadata } from 'next';
import { listRoutines, pickRoutine, routineData } from '@/lib/routine/data';
import { PageTop } from '../AdminShell';
import { PageBody, PageTitle } from '../ui';
import { RoutinePicker } from './controls';
import { RoutineGrid } from './RoutineGrid';
import { NoRoutine, routineSub } from './ui';

export const metadata: Metadata = { title: 'ক্লাস রুটিন' };
export const dynamic = 'force-dynamic';

export default async function RoutinePage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const [routines, routine] = await Promise.all([listRoutines(), pickRoutine(r)]);
  const data = routine ? await routineData(routine) : null;
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন' }]} round={false} />
      <PageBody className="rt-a3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageTitle
            sub={
              data && (
                <>
                  {routineSub(data.routine)}
                  <span className="sv-no-print"> · যেকোনো ঘরে চাপ দিয়ে ক্লাস যোগ করুন বা বদলান</span>
                </>
              )
            }
          >
            ক্লাস রুটিন
          </PageTitle>
          {data && <RoutinePicker routines={routines} current={data.routine.id} />}
        </div>
        {!data ? (
          <NoRoutine />
        ) : !data.periods.length || !data.groups.length ? (
          <NoRoutine>এই রুটিনে এখনো {data.periods.length ? 'কোনো গ্রুপ' : 'কোনো পিরিয়ড'} নেই।</NoRoutine>
        ) : (
          <RoutineGrid data={data} />
        )}
      </PageBody>
    </>
  );
}
