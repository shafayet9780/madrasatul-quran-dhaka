import { NextResponse, type NextRequest } from 'next/server';
import { localOverrides } from '@/lib/admissions/local';
import { seedSampleApplications } from '@/lib/admissions/testing/sample-applications';
import type { MockGateway } from '@/lib/admissions/testing/mock-gateway';

/** Local preview only: adds sample applications (?paid=&unpaid=&drafts=). 404 everywhere else. */
export async function POST(request: NextRequest) {
  const local = localOverrides();
  if (!local?.gateway) return new NextResponse('Not found', { status: 404 });
  const q = request.nextUrl.searchParams;
  const n = (k: string, d: number) => Math.min(50, Math.max(0, Number(q.get(k) ?? d) || 0));
  const made = await seedSampleApplications({
    paid: n('paid', 6),
    unpaid: n('unpaid', 3),
    drafts: n('drafts', 2),
    origin: request.nextUrl.origin,
    gateway: local.gateway as MockGateway,
    store: local.store,
  });
  return NextResponse.json(made);
}
