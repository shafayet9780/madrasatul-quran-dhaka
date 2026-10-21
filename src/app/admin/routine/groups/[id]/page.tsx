import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listRoutines, pickRoutine, routineData } from '@/lib/routine/data';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { distinctTimes, sameTime } from '@/lib/routine/days';
import { PageTop } from '../../../AdminShell';
import { ReportTools } from '../../../reports/ReportTools';
import { EmptyState, PageBody, PageTitle } from '../../../ui';
import { RoutinePicker } from '../../controls';
import { NoRoutine, routineSub } from '../../ui';
import { WeekTable } from '../../WeekTable';

export const metadata: Metadata = { title: 'ক্লাসের রুটিন' };
export const dynamic = 'force-dynamic';

const RULE = { any: '', male: 'শুধু পুরুষ টিচার', female: 'শুধু মহিলা টিচার' };

export default async function GroupPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string }> }) {
  const [{ id }, { r }] = await Promise.all([params, searchParams]);
  const [routines, routine] = await Promise.all([listRoutines(), pickRoutine(r)]);
  const data = routine ? await routineData(routine) : null;
  const group = data?.groups.find((g) => g.id === id);
  if (data && !group) notFound();
  const crumbs = [{ label: 'রুটিন', href: '/admin/routine' }, { label: group?.name ?? '' }];
  if (!data || !group) {
    return (
      <>
        <PageTop crumbs={crumbs} round={false} />
        <PageBody>
          <NoRoutine />
        </PageBody>
      </>
    );
  }
  const groups = new Map(data.groups.map((g) => [g.id, g]));
  const rooms = new Map(data.rooms.map((x) => [x.id, x.name]));
  const subjects = new Map(data.subjects.map((s) => [s.id, s.name]));
  const teachers = new Map(data.teachers.map((t) => [t.id, t.shortName]));
  // A class's own lessons and the groups that sit in its room; a group's lessons wherever it sits.
  const mine = data.assignments.filter((a) => a.groupId === id || a.hostGroupId === id);
  const room = group.defaultRoomId ? rooms.get(group.defaultRoomId) : null;
  const type = data.types.find((t) => t.id === group.typeId);
  const q = routine && routine.status !== 'active' ? `?r=${routine.id}` : '';

  return (
    <>
      <PageTop crumbs={crumbs} round={false} />
      <PageBody className="rt-a4l">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageTitle sub={routineSub(data.routine, [type && (type.placement === 'class' ? `${type.name} ক্লাস` : `${type.name} গ্রুপ`), room && `রুম ${bn(room)}`, RULE[group.genderRule]].filter(Boolean).join(' · '))}>{group.name}</PageTitle>
          <div className="flex flex-wrap items-center gap-3">
            <RoutinePicker routines={routines} current={data.routine.id} />
            <ReportTools printLabel="প্রিন্ট (A4)" />
          </div>
        </div>
        {mine.length === 0 ? (
          <EmptyState>
            এই রুটিনে {group.name}-এর কোনো ক্লাস নেই।{' '}
            <Link href={`/admin/routine${q}`} className="text-foreground underline underline-offset-4">
              রুটিনে যোগ করুন
            </Link>
          </EmptyState>
        ) : (
          <WeekTable
            times={distinctTimes(mine)}
            label={`${group.name}-এর সাপ্তাহিক রুটিন`}
            cell={(day, time) =>
              mine
                .filter((a) => sameTime(a, time) && a.days.includes(day))
                .map((a) => {
                  const host = a.hostGroupId && a.groupId === id ? groups.get(a.hostGroupId) : undefined;
                  return (
                    <div key={a.id} className="rt-entry">
                      {a.groupId !== id && (
                        <Link href={`/admin/routine/groups/${a.groupId}${q}`} className="font-semibold no-underline hover:underline">
                          {groups.get(a.groupId)?.name}
                        </Link>
                      )}
                      <span className="font-medium">{subjects.get(a.subjectId)}</span>
                      <span>
                        <Link href={`/admin/routine/teachers/${a.teacherId}${q}`} className="no-underline hover:underline">
                          {teachers.get(a.teacherId)}
                        </Link>
                        {a.taId && (
                          <>
                            {' + '}
                            <Link href={`/admin/routine/teachers/${a.taId}${q}`} className="no-underline hover:underline">
                              {teachers.get(a.taId)}
                            </Link>
                          </>
                        )}
                      </span>
                      {host && <span className="rt-days">{host.name}-এর রুমে</span>}
                    </div>
                  );
                })
            }
          />
        )}
      </PageBody>
    </>
  );
}
