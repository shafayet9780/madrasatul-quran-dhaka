import type { Metadata } from 'next';
import { formatDateTime } from '@/lib/survey/dates';
import { lastAppliedImport } from '@/lib/survey/erp-import-server';
import { ImportBoard } from './ImportBoard';
import { PageTop } from '../AdminShell';
import { PageBody, PageTitle } from '../ui';

export const metadata: Metadata = { title: 'ERP ইমপোর্ট' };
export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const last = await lastAppliedImport();
  return (
    <>
      <PageTop crumbs={[{ label: 'অ্যাডমিন' }, { label: 'ERP ইমপোর্ট' }]} round={false} />
      <PageBody>
        <PageTitle sub={`প্রতিটি রাউন্ড খোলার আগে হালনাগাদ করুন · শেষ ইমপোর্ট: ${last?.appliedAt ? formatDateTime(last.appliedAt) : 'এখনো হয়নি'}`}>ERP থেকে শিক্ষার্থী ইমপোর্ট</PageTitle>
        <ImportBoard />
      </PageBody>
    </>
  );
}
