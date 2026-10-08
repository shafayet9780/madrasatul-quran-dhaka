import type { Metadata } from 'next';
import { ListPage, type ListSearch } from '../ListPage';

export const metadata: Metadata = { title: 'ফি বাকি' };
export const dynamic = 'force-dynamic';

export default async function UnpaidPage({ searchParams }: { searchParams: Promise<ListSearch> }) {
  return <ListPage tab="unpaid" search={await searchParams} />;
}
