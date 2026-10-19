import type { Metadata } from 'next';
import { listGroups, listRooms, listRoutines, listSubjects, pickRoutine, routineData } from '@/lib/routine/data';
import { PageTop } from '../../AdminShell';
import { PageBody, PageTitle } from '../../ui';
import { SetupBoard } from './SetupBoard';

export const metadata: Metadata = { title: 'রুটিন সেটআপ' };
export const dynamic = 'force-dynamic';

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const [routines, routine, subjects, rooms, groups] = await Promise.all([listRoutines(), pickRoutine(r), listSubjects(), listRooms(), listGroups()]);
  const periods = routine ? (await routineData(routine)).periods : [];
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'সেটআপ' }]} round={false} />
      <PageBody>
        <PageTitle sub="রুটিনের নাম ও পিরিয়ড, বিষয়, রুম আর ক্লাস/লেভেল গ্রুপ। শিক্ষক যোগ করুন শিক্ষক পেজে।">পিরিয়ড, গ্রুপ, রুম</PageTitle>
        <SetupBoard routines={routines} routine={routine} periods={periods} subjects={subjects} rooms={rooms} groups={groups} />
      </PageBody>
    </>
  );
}
