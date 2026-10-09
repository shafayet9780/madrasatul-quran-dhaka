import Link from 'next/link';
import { PageTop } from '../AdminShell';
import { EmptyState, LINK, PageBody } from '../ui';

export function NoRounds() {
  return (
    <>
      <PageTop crumbs={[{ label: 'রিপোর্ট' }]} round={false} />
      <PageBody>
        <EmptyState>
          এখনো কোনো শিক্ষক রিভিউ রাউন্ড খোলা হয়নি।{' '}
          <Link href="/admin/rounds" className={LINK}>
            রাউন্ড পাতায়
          </Link>{' '}
          গিয়ে একটি রাউন্ড খুলুন।
        </EmptyState>
      </PageBody>
    </>
  );
}
