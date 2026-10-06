import type { Metadata } from 'next';
import { formatDateTime } from '@/lib/survey/dates';
import { lastAppliedImport } from '@/lib/survey/erp-import-server';
import { ImportBoard } from './ImportBoard';
import { PageTop } from '../AdminShell';

export const metadata: Metadata = { title: 'ERP ইমপোর্ট' };
export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const last = await lastAppliedImport();
  return (
    <>
      <PageTop crumbs={[{ label: 'অ্যাডমিন' }, { label: 'ERP ইমপোর্ট' }]} round={false} />
      <div className="flex flex-col gap-1">
        <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
          ERP থেকে শিক্ষার্থী ইমপোর্ট
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>
          প্রতিটি রাউন্ড খোলার আগে হালনাগাদ করুন · শেষ ইমপোর্ট: {last?.appliedAt ? formatDateTime(last.appliedAt) : 'এখনো হয়নি'}
        </p>
      </div>
      <ImportBoard />
    </>
  );
}
