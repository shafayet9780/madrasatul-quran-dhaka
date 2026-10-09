import Link from 'next/link';
import { Download } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { adminCycle, applicationCounts, listApplications, type AdminCycle, type ListTab } from '@/lib/admissions/admin';
import { OFFICE_STATUSES, STATUS_LABEL, attemptsText, lastActive, shortDate, type ApplicationStatus } from '@/lib/admissions/admin-labels';
import { chapterStatus } from '@/lib/admissions/answers';
import { loadSnapshot } from '@/lib/admissions/cycle';
import { longDate, txt } from '@/lib/admissions/display';
import { fieldWithRole, guardianSections, type FormSnapshot } from '@/lib/admissions/form-config';
import { formatMobile, toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../AdminShell';
import { DeleteUnpaid, ListFilters, PaidTable, type PaidRow } from './ListControls';
import { EmptyState, LAT, PageBody, PageTitle } from '../ui';
import { ListTabs } from './ui';

export type ListSearch = { q?: string; class?: string; status?: string; eval?: string; page?: string; deleted?: string };

const PAGE_SIZE = 25;

export const classOptions = (snapshot: FormSnapshot) =>
  (fieldWithRole(snapshot, 'classApplied')?.options ?? []).filter((o) => o.code).map((o) => ({ value: o.code!, label: txt(o.label, 'bengali'), optionValue: o.value }));

export function NoCycle() {
  return (
    <>
      <PageTop crumbs={[{ label: 'ভর্তি' }]} round={false} />
      <PageBody>
        <PageTitle>ভর্তি</PageTitle>
        <EmptyState>এখনো কোনো ভর্তি সেশন খোলা হয়নি। স্টুডিওতে প্রি-অ্যাডমিশন ফর্মটি প্রকাশ করলে এখানে আবেদন দেখা যাবে।</EmptyState>
      </PageBody>
    </>
  );
}

export function ExportButton() {
  return (
    <Button asChild variant="outline" className="adm h-9 bg-white shadow-none">
      {/* A file download, not a page (the linter mistakes it for the [id] page). */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/admin/admissions/export">
        <Download aria-hidden />
        Excel এক্সপোর্ট
      </a>
    </Button>
  );
}

/** Progress of an unpaid application: complete, chapters done, or only started. */
function progress(status: ApplicationStatus, snapshot: FormSnapshot | null, answers: Record<string, unknown>): string {
  if (status === 'unpaid') return 'ফর্ম সম্পূর্ণ';
  if (!snapshot) return '';
  const chapters = guardianSections(snapshot).map((s) => chapterStatus(s, answers as never));
  if (chapters.every((c) => c.answered === 0)) return 'শুধু শুরু';
  return `${bn(chapters.length)}টির মধ্যে ${bn(chapters.filter((c) => c.status === 'done').length)}টি অধ্যায়`;
}

export async function ListPage({ tab, search }: { tab: ListTab; search: ListSearch }) {
  const cycle = await adminCycle();
  if (!cycle) return <NoCycle />;
  const classes = classOptions(cycle.snapshot);
  const page = Math.max(1, Number(search.page) || 1);
  const statuses: ApplicationStatus[] = tab === 'paid' ? OFFICE_STATUSES : ['draft', 'unpaid'];
  const status = statuses.find((s) => s === search.status);
  const [counts, { rows, total }] = await Promise.all([
    applicationCounts(cycle.cycleId),
    listApplications(cycle.cycleId, {
      tab,
      q: search.q?.slice(0, 80),
      classCode: classes.find((c) => c.value === search.class)?.value,
      status,
      evalFee: search.eval === 'yes' || search.eval === 'no' ? search.eval : undefined,
      page,
      pageSize: PAGE_SIZE,
      classCodes: classes.map((c) => c.value),
    }),
  ]);
  const classLabel = (value: string | null) => classes.find((c) => c.optionValue === value)?.label ?? '';
  const filtered = Boolean(search.q || search.class || status || search.eval);
  const title = tab === 'paid' ? 'আবেদন' : 'ফি বাকি';

  const filters = [
    { key: 'class', label: 'শ্রেণী', options: classes.map((c) => ({ value: c.value, label: c.label })) },
    {
      key: 'status',
      label: tab === 'paid' ? 'অবস্থা' : 'ধাপ',
      options: tab === 'paid' ? statuses.map((s) => ({ value: s, label: STATUS_LABEL[s] })) : [
        { value: 'unpaid', label: 'ফর্ম সম্পূর্ণ' },
        { value: 'draft', label: 'ফর্ম অসম্পূর্ণ' },
      ],
    },
    ...(tab === 'paid'
      ? [{ key: 'eval', label: 'মূল্যায়ন ফি', options: [{ value: 'yes', label: 'গৃহীত' }, { value: 'no', label: 'বাকি' }] }]
      : []),
  ];

  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(total, page * PAGE_SIZE);
  const pageHref = (p: number) => {
    const params = new URLSearchParams(Object.entries(search).filter(([k, v]) => v && k !== 'page' && k !== 'deleted') as [string, string][]);
    if (p > 1) params.set('page', String(p));
    const q = params.toString();
    return q ? `?${q}` : '?';
  };

  return (
    <>
      <PageTop crumbs={[{ label: 'ভর্তি', href: '/admin/admissions' }, { label: title }]} round={false} actions={tab === 'paid' ? <ExportButton /> : undefined} />
      <PageBody>
        <PageTitle>{title}</PageTitle>
        <ListTabs current={tab} paid={counts.paid} unpaid={counts.unpaid} />
        <ListFilters filters={filters} />
        {search.deleted && <p className="m-0 text-sm text-success" role="status">আবেদনটি মুছে ফেলা হয়েছে।</p>}

        {tab === 'unpaid' && (
          <p className="m-0 max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
            এই আবেদনগুলোর ফর্ম শুরু বা পূরণ হয়েছে, ফি পরিশোধ হয়নি। ফোন করে মনে করিয়ে দিতে পারেন। দরকার না হলে মুছে দিন; তথ্য ও আপলোড করা কাগজ দুটোই মুছে যাবে।
          </p>
        )}

        {rows.length === 0 ? (
          <EmptyState>{filtered ? 'এই খোঁজ বা ফিল্টারে কোনো আবেদন নেই।' : tab === 'paid' ? 'এখনো কোনো আবেদনের ফি পরিশোধ হয়নি।' : 'ফি বাকি থাকা কোনো আবেদন নেই।'}</EmptyState>
        ) : tab === 'paid' ? (
          <PaidTable
            rows={rows.map(
              (r): PaidRow => ({
                id: r.id,
                publicRef: r.publicRef ?? '',
                name: r.studentNameBn ?? '',
                dob: r.dateOfBirth ? longDate(r.dateOfBirth, 'bengali') : '',
                classLabel: classLabel(r.classValue),
                mobile: formatMobile(r.primaryMobile),
                status: r.status,
                paid: r.paidAt ? shortDate(r.paidAt) : '',
                evalFee: !!r.evalFeeReceivedAt,
              }),
            )}
          />
        ) : (
          <UnpaidTable cycle={cycle} rows={rows} classLabel={classLabel} />
        )}

        {total > 0 && (
          <div className="flex items-center justify-between text-[13.5px] text-muted-foreground">
            <span>
              {bn(total)}টির মধ্যে {bn(from)} থেকে {bn(to)}
            </span>
            <div className="flex gap-1.5">
              <PageLink href={page > 1 ? pageHref(page - 1) : null}>আগের</PageLink>
              <PageLink href={to < total ? pageHref(page + 1) : null}>পরের</PageLink>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}

function PageLink({ href, children }: { href: string | null; children: string }) {
  if (!href)
    return (
      <Button variant="outline" className="h-9 bg-white shadow-none" disabled>
        {children}
      </Button>
    );
  return (
    <Button asChild variant="outline" className="h-9 bg-white shadow-none">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

async function UnpaidTable({ cycle, rows, classLabel }: { cycle: AdminCycle; rows: Awaited<ReturnType<typeof listApplications>>['rows']; classLabel: (v: string | null) => string }) {
  const versions = [...new Set(rows.map((r) => r.snapshotVersion))];
  const snapshots = new Map(await Promise.all(versions.map(async (v) => [v, await loadSnapshot(cycle.cycleId, v)] as const)));
  return (
    <div className="overflow-x-auto rounded-[10px] border">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr className="[&>th]:h-10 [&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:text-left [&>th]:text-[13px] [&>th]:font-medium [&>th]:text-muted-foreground">
            <th>শিক্ষার্থী</th>
            <th>শ্রেণী</th>
            <th>অভিভাবকের মোবাইল</th>
            <th>অগ্রগতি</th>
            <th>শেষ সক্রিয়</th>
            <th>পেমেন্ট চেষ্টা</th>
            <th>
              <span className="sr-only">কাজ</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const name = r.studentNameBn || 'নাম দেওয়া হয়নি';
            return (
              <tr key={r.id} className="hover:bg-[#fafafa] [&>td]:border-b [&>td]:px-3 [&>td]:py-2.5 [&>td]:align-middle">
                <td>
                  <Link href={`/admin/admissions/${r.id}`} className={cn('no-underline hover:underline', r.studentNameBn ? 'text-foreground' : 'text-muted-foreground')}>
                    {name}
                  </Link>
                </td>
                <td>{classLabel(r.classValue)}</td>
                <td className={cn(LAT, 'text-[13.5px]')}>
                  <a href={`tel:+${r.primaryMobile}`} className="text-foreground">
                    {formatMobile(r.primaryMobile)}
                  </a>
                </td>
                <td>{progress(r.status, snapshots.get(r.snapshotVersion) ?? null, r.answers)}</td>
                <td className="text-muted-foreground">{lastActive(r.lastActiveAt)}</td>
                <td className="text-muted-foreground">{attemptsText(r.paymentAttempts, r.lastPaymentStatus, bn)}</td>
                <td className="text-right">
                  <DeleteUnpaid id={r.id} name={name} from="list" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
