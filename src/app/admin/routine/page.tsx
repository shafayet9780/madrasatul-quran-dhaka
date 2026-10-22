import type { Metadata } from 'next';
import { dayRecords, listRoutines, pickRoutine, routineData } from '@/lib/routine/data';
import { dayOfDate, distinctTimes, dhakaToday } from '@/lib/routine/days';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
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
  const date = dhakaToday();
  const weekday = dayOfDate(date);
  // Today's absences and proxies show in the active routine when today is on screen.
  const [data, records] = await Promise.all([routine ? routineData(routine) : null, routine?.status === 'active' && weekday !== null ? dayRecords(date) : null]);
  const today = records && weekday !== null ? { day: weekday, ...records } : null;
  const classes = data ? data.groups.filter((g) => g.active && data.types.find((t) => t.id === g.typeId)?.placement === 'class').length : 0;
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন' }]} round={false} />
      <PageBody className="rt-print">
        <p className="sv-print-only m-0 text-lg font-bold">মাদরাসাতুল কুরআন, ঢাকা · ক্লাস রুটিন {data?.routine.name}</p>
        {!data ? (
          <NoRoutine />
        ) : (
          <RoutineGrid
            data={data}
            today={today}
            title={
              <PageTitle key="title" sub={routineSub(data.routine, `${bn(classes)}টা ক্লাস · ${bn(data.groups.filter((g) => g.active).length - classes)}টা গ্রুপ · ${bn(distinctTimes(data.assignments).length)}টা সময়`)}>
                ক্লাস রুটিন
              </PageTitle>
            }
            picker={<RoutinePicker key="picker" routines={routines} current={data.routine.id} />}
          />
        )}
      </PageBody>
    </>
  );
}
