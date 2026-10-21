import type { Metadata } from 'next';
import { activeRoutine, listSubjects, listTeachers, listTypes, routineData } from '@/lib/routine/data';
import { daysText, spanText } from '@/lib/routine/days';
import { teacherLoads } from '@/lib/routine/load';
import { PageTop } from '../../AdminShell';
import { PageBody } from '../../ui';
import { TeacherList } from './TeacherList';

export const metadata: Metadata = { title: 'টিচার' };
export const dynamic = 'force-dynamic';

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ show?: string; edit?: string; new?: string }> }) {
  const sp = await searchParams;
  const [teachers, subjects, types, routine] = await Promise.all([listTeachers(), listSubjects(), listTypes(), activeRoutine()]);
  const data = routine ? await routineData(routine) : null;
  const loads = data ? Object.fromEntries(teacherLoads(teachers, data.assignments)) : null;
  // Each teacher's lessons (as main teacher) in the active routine, for the delete confirm.
  const lessonsOf: Record<string, string[]> = {};
  if (data) {
    const group = new Map(data.groups.map((g) => [g.id, g.name]));
    const subject = new Map(data.subjects.map((s) => [s.id, s.name]));
    for (const a of [...data.assignments].sort((x, y) => x.startsAt - y.startsAt)) {
      (lessonsOf[a.teacherId] ??= []).push(`${group.get(a.groupId)} · ${subject.get(a.subjectId)} · ${daysText(a.days)} ${spanText(a)}`);
    }
  }
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'টিচার' }]} round={false} />
      <PageBody>
        <TeacherList teachers={teachers} subjects={subjects} types={types} loads={loads} lessonsOf={lessonsOf} showAll={sp.show === 'all'} start={sp.new ? 'new' : (sp.edit ?? null)} />
      </PageBody>
    </>
  );
}
