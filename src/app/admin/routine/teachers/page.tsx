import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { activeRoutine, listSubjects, listTeachers, routineData } from '@/lib/routine/data';
import { teacherLoads } from '@/lib/routine/load';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { EmptyState, LINK, PageBody, PageTitle } from '../../ui';
import { LoadBadge } from '../ui';

export const metadata: Metadata = { title: 'টিচার' };
export const dynamic = 'force-dynamic';

const TH = 'px-3 py-2.5 text-left text-[12.5px] font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-top';

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const all = (await searchParams).show === 'all';
  const [teachers, subjects, routine] = await Promise.all([listTeachers(), listSubjects(), activeRoutine()]);
  const data = routine ? await routineData(routine) : null;
  const loads = data ? teacherLoads(teachers, data.assignments, data.periods) : null;
  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const shown = teachers.filter((t) => all || t.active);
  const hidden = teachers.length - shown.length;
  return (
    <>
      <PageTop
        crumbs={[{ label: 'রুটিন', href: '/admin/routine' }, { label: 'টিচার' }]}
        round={false}
        actions={
          <Button asChild className="adm h-9">
            <Link href="/admin/routine/teachers/new">
              <Plus aria-hidden />
              নতুন টিচার
            </Link>
          </Button>
        }
      />
      <PageBody>
        <PageTitle sub={`${bn(teachers.filter((t) => t.active && !t.isVacancy).length)} জন টিচার${teachers.some((t) => t.isVacancy && t.active) ? ` · ${bn(teachers.filter((t) => t.isVacancy && t.active).length)}টা খালি পোস্ট` : ''}`}>টিচার</PageTitle>
        {shown.length === 0 ? (
          <EmptyState>এখনো কোনো টিচার যোগ করা হয়নি। উপরে &quot;নতুন টিচার&quot; বাটনে চাপুন।</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className={TH}>নাম</th>
                  <th className={TH}>পদবি · ডিপার্টমেন্ট</th>
                  <th className={TH}>যে সাবজেক্ট পড়ান</th>
                  <th className={TH}>সপ্তাহে টার্গেট</th>
                  <th className={TH}>ওয়ার্কলোড</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => {
                  const load = loads?.get(t.id);
                  return (
                    <tr key={t.id} className={cn('border-b last:border-0', !t.active && 'text-muted-foreground')}>
                      <td className={TD}>
                        <Link href={`/admin/routine/teachers/${t.id}`} className={cn(LINK, 'font-medium')}>
                          {t.shortName}
                        </Link>
                        <div className="text-[12.5px] text-muted-foreground">
                          {t.fullName}
                          {t.isVacancy && ' · খালি পোস্ট'}
                          {!t.active && ' · বন্ধ'}
                        </div>
                      </td>
                      <td className={TD}>{[t.designation, t.department].filter(Boolean).join(' · ') || '—'}</td>
                      <td className={TD}>{t.subjectIds.map((id) => subjectName.get(id)).filter(Boolean).join(', ') || '—'}</td>
                      <td className={TD}>{t.targetPeriods != null ? `${bn(t.targetPeriods)} পিরিয়ড` : '—'}</td>
                      <td className={TD}>
                        {load ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="tabular-nums">{bn(load.weighted)}</span>
                            <LoadBadge status={load.status} />
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(hidden > 0 || all) && (
          <Link href={all ? '/admin/routine/teachers' : '/admin/routine/teachers?show=all'} className={cn(LINK, 'self-start text-sm')}>
            {all ? 'শুধু চালু টিচারদের দেখুন' : `বন্ধ থাকা ${bn(hidden)} জনকেও দেখুন`}
          </Link>
        )}
      </PageBody>
    </>
  );
}
