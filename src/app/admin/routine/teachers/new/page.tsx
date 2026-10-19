import type { Metadata } from 'next';
import { listSubjects } from '@/lib/routine/data';
import { PageTop } from '../../../AdminShell';
import { PageBody, PageTitle } from '../../../ui';
import { TeacherForm } from '../TeacherForm';

export const metadata: Metadata = { title: 'নতুন শিক্ষক' };
export const dynamic = 'force-dynamic';

export default async function NewTeacherPage() {
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'শিক্ষক', href: '/admin/routine/teachers' }, { label: 'নতুন শিক্ষক' }]} round={false} />
      <PageBody>
        <PageTitle>নতুন শিক্ষক</PageTitle>
        <TeacherForm teacher={null} subjects={await listSubjects()} />
      </PageBody>
    </>
  );
}
