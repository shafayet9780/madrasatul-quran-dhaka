import type { Metadata } from 'next';
import { listSubjects } from '@/lib/routine/data';
import { PageTop } from '../../../AdminShell';
import { PageBody, PageTitle } from '../../../ui';
import { TeacherForm } from '../TeacherForm';

export const metadata: Metadata = { title: 'নতুন টিচার' };
export const dynamic = 'force-dynamic';

export default async function NewTeacherPage() {
  return (
    <>
      <PageTop crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'টিচার', href: '/admin/routine/teachers' }, { label: 'নতুন টিচার' }]} round={false} />
      <PageBody>
        <PageTitle>নতুন টিচার</PageTitle>
        <TeacherForm teacher={null} subjects={await listSubjects()} />
      </PageBody>
    </>
  );
}
