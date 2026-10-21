import type { Metadata } from 'next';
import { groupLessonCounts, listGroups, listRooms, listRoutines, listSubjects, listTeachers, listTypes, pickRoutine } from '@/lib/routine/data';
import { PageTop } from '../../AdminShell';
import { PageBody, PageTitle } from '../../ui';
import { SetupBoard, type Tab } from './SetupBoard';

export const metadata: Metadata = { title: 'রুটিন সেটআপ' };
export const dynamic = 'force-dynamic';

const TABS: Tab[] = ['types', 'classes', 'subjects', 'rooms', 'routines'];

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ r?: string; tab?: string }> }) {
  const { r, tab } = await searchParams;
  const [routines, current, types, groups, subjects, rooms, teachers, lessons] = await Promise.all([listRoutines(), pickRoutine(r), listTypes(), listGroups(), listSubjects(), listRooms(), listTeachers(), groupLessonCounts()]);
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'সেটআপ' }]} round={false} />
      <PageBody>
        <PageTitle sub="ক্লাসের ধরন, ক্লাস ও গ্রুপ, সাবজেক্ট, রুম আর রুটিনের ভার্সন। টিচার যোগ করতে টিচার পেজে যান।">সেটআপ</PageTitle>
        <SetupBoard tab={TABS.find((t) => t === tab) ?? 'classes'} routines={routines} current={current} types={types} groups={groups} subjects={subjects} rooms={rooms} teachers={teachers} lessons={lessons} />
      </PageBody>
    </>
  );
}
