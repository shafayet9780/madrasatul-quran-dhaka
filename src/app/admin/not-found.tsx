import Link from 'next/link';
import { PageTop } from './AdminShell';

export default function AdminNotFound() {
  return (
    <>
      <PageTop crumbs={[{ label: 'পাওয়া যায়নি' }]} round={false} />
      <div className="sv-card flex flex-col gap-2" style={{ padding: 20 }}>
        <h1 className="sv-head sv-h2">পাতাটি পাওয়া যায়নি</h1>
        <Link href="/admin/reports/overview">ওভারভিউতে ফিরুন</Link>
      </div>
    </>
  );
}
