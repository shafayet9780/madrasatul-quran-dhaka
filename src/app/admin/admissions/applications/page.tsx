import type { Metadata } from 'next';
import { ListPage, type ListSearch } from '../ListPage';

export const metadata: Metadata = { title: 'ভর্তি আবেদন' };
export const dynamic = 'force-dynamic';

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<ListSearch> }) {
  return <ListPage tab="paid" search={await searchParams} />;
}
