import Link from 'next/link';
import { PageTop } from './AdminShell';
import { LINK, PageBody } from './ui';

export default function AdminNotFound() {
  return (
    <>
      <PageTop crumbs={[{ label: 'পাওয়া যায়নি' }]} round={false} />
      <PageBody>
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
          <h1 className="m-0 text-lg font-semibold">পাতাটি পাওয়া যায়নি</h1>
          <Link href="/admin/reports/overview" className={LINK}>
            ওভারভিউতে ফিরুন
          </Link>
        </section>
      </PageBody>
    </>
  );
}
