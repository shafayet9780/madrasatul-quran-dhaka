import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listSubjects, listTeachers } from '@/lib/routine/data';
import { PageTop } from '../../../../AdminShell';
import { PageBody, PageTitle } from '../../../../ui';
import { TeacherForm } from '../../TeacherForm';

export const metadata: Metadata = { title: 'টিচারের তথ্য এডিট' };
export const dynamic = 'force-dynamic';

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teachers, subjects] = await Promise.all([listTeachers(), listSubjects()]);
  const teacher = teachers.find((t) => t.id === id);
  if (!teacher) notFound();
  return (
    <>
      <PageTop
        crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'টিচার', href: '/admin/routine/teachers' }, { label: teacher.shortName, href: `/admin/routine/teachers/${id}` }, { label: 'এডিট' }]}
        round={false}
      />
      <PageBody>
        <PageTitle sub={teacher.fullName}>{teacher.shortName}: তথ্য এডিট</PageTitle>
        <TeacherForm teacher={teacher} subjects={subjects} />
      </PageBody>
    </>
  );
}
