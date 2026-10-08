import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { applicationDetail } from '@/lib/admissions/admin';
import { PAYMENT_STATUS_LABEL, eventText, shortDate } from '@/lib/admissions/admin-labels';
import { answerText } from '@/lib/admissions/answer-text';
import { isVisible, type FileAnswer } from '@/lib/admissions/answers';
import { dateTime, longDate, taka, txt } from '@/lib/admissions/display';
import { fieldWithRole } from '@/lib/admissions/form-config';
import { formatMobile, toBengaliDigits as bn } from '@/lib/admissions/normalise';
import { cn } from '@/lib/utils';
import { PageTop } from '../../AdminShell';
import { DeleteUnpaid } from '../ListControls';
import { AcceptHeld, EvaluationSwitches, NoteForm, ResendEmail, StatusForm } from '../DetailControls';
import { AdmBody, Card, LAT, StatusBadge } from '../ui';
import { isOwnKey } from '@/lib/admissions/files';

export const metadata: Metadata = { title: 'আবেদন' };
export const dynamic = 'force-dynamic';

const LABELS = { yes: 'হ্যাঁ', no: 'না', notGiven: 'দেওয়া হয়নি', fileAttached: (type: string) => `${type} সংযুক্ত` };
const when = (d: Date) => dateTime(d.toISOString(), 'bengali');
/** "৮ অক্টো, সকাল ৬:০৬" for the activity log. */
const logWhen = (d: Date) => `${shortDate(d)}, ${when(d).split(', ')[1]}`;
const fileUrl = (id: string, key: string) => `/admin/admissions/file?id=${id}&key=${encodeURIComponent(key)}`;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };

export default async function ApplicationPage({ params, searchParams }: Props) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const detail = await applicationDetail(id);
  if (!detail) notFound();
  const { app, snapshot, payments, events } = detail;
  const paid = !!app.publicRef;
  const fee = taka(snapshot.settings.evaluationFee, 'bengali');

  const classField = fieldWithRole(snapshot, 'classApplied');
  const classLabel = txt(classField?.options.find((o) => o.value === app.classValue)?.label, 'bengali');
  const photoField = fieldWithRole(snapshot, 'studentPhoto');
  const photo = photoField ? (app.answers[photoField.key] as FileAnswer | undefined) : undefined;
  const name = app.studentNameBn || 'নাম দেওয়া হয়নি';

  const sections = snapshot.sections
    .map((section) => ({
      key: section.key,
      title: txt(section.title, 'bengali'),
      rows: section.fields
        .filter((f) => f.type !== 'file' && isVisible(f, app.answers))
        .map((f) => ({ key: f.key, label: txt(f.label, 'bengali'), value: answerText(f, app.answers[f.key], 'bengali', LABELS), lat: f.type === 'email' || f.role === 'studentNameEn' })),
    }))
    .filter((s) => s.rows.length);
  const documents = snapshot.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.type === 'file' && app.answers[f.key])
    .map((f) => ({ label: txt(f.label, 'bengali'), file: app.answers[f.key] as FileAnswer }))
    .filter((d) => !!d.file.key && isOwnKey(app.id, d.file.key));
  const notes = events.filter((e) => e.kind === 'note');
  const log = events.filter((e) => e.kind !== 'note');

  const back =
    from === 'evaluation-day'
      ? { label: 'মূল্যায়নের দিন', href: '/admin/admissions/evaluation-day' }
      : paid
        ? { label: 'আবেদন', href: '/admin/admissions/applications' }
        : { label: 'ফি বাকি', href: '/admin/admissions/unpaid' };

  const sub = [classLabel, app.dateOfBirth && `জন্ম ${longDate(app.dateOfBirth, 'bengali')}`].filter(Boolean).join(', ');

  return (
    <>
      <PageTop crumbs={[{ label: 'ভর্তি', href: '/admin/admissions' }, back, { label: app.publicRef ?? name }]} round={false} />
      <AdmBody className="gap-5">
        {from === 'evaluation-day' && (
          <Link href={back.href} className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground no-underline hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            পরের আইডি খুঁজতে মূল্যায়নের দিনে ফিরুন
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-5">
          {photo?.key ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl(app.id, photo.key)} alt={`${name}-এর ছবি`} className="h-20 w-16 flex-none rounded-lg border object-cover" />
          ) : (
            <div className="flex h-20 w-16 flex-none items-center justify-center rounded-lg border bg-muted text-[11px] text-muted-foreground">ছবি নেই</div>
          )}
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-0.5">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="m-0 text-2xl font-bold tracking-[-0.01em]">{name}</h1>
              {app.publicRef && <span className={cn(LAT, 'text-base font-semibold text-muted-foreground')}>{app.publicRef}</span>}
              <StatusBadge status={app.status} />
            </div>
            <span className="text-sm text-muted-foreground">
              {sub}
              {sub && '। '}
              {app.fatherName && `পিতা ${app.fatherName}, `}
              <a href={`tel:+${app.primaryMobile}`} className={cn(LAT, 'text-muted-foreground')}>
                {formatMobile(app.primaryMobile)}
              </a>
            </span>
            <span className="text-[13px] text-muted-foreground">
              আবেদন শুরু {shortDate(app.createdAt)}, {app.locale === 'english' ? 'ইংরেজিতে' : 'বাংলায়'} পূরণ করা{app.email && <>, <span className={LAT}>{app.email}</span></>}
            </span>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {paid ? (
              <>
                <Button asChild className="h-9">
                  <a href={`/admin/admissions/${app.id}/pdf`}>
                    <Download aria-hidden />
                    আবেদনপত্র PDF
                  </a>
                </Button>
                <ResendEmail id={app.id} />
              </>
            ) : (
              <DeleteUnpaid id={app.id} name={name} from="detail" />
            )}
          </div>
        </div>

        {/* Office controls first on narrow screens: evaluation day is worked on phones. */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            {sections.map((s) => (
              <Card key={s.key} title={s.title}>
                <dl className="m-0 grid grid-cols-1 gap-x-4 text-sm sm:grid-cols-[minmax(140px,220px)_1fr]">
                  {s.rows.map((r) => (
                    <div key={r.key} className="contents">
                      <dt className="pt-2 text-muted-foreground sm:border-t sm:py-2 sm:first-of-type:border-t-0">{r.label}</dt>
                      <dd className={cn('m-0 border-b pb-2 sm:border-b-0 sm:border-t sm:py-2', r.lat && LAT)}>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>

          <div className="order-first flex min-w-0 flex-col gap-4 xl:order-none">
            {paid && (
              <Card title="অবস্থা">
                <StatusForm id={app.id} status={app.status} />
                <p className="m-0 mt-2.5 text-[13px] text-muted-foreground">ধাপ: জমা, মূল্যায়ন নির্ধারিত, মূল্যায়িত, সিদ্ধান্ত, ERP-তে পাঠানো</p>
              </Card>
            )}
            {paid && (
              <Card title="মূল্যায়নের দিন">
                <EvaluationSwitches
                  id={app.id}
                  attended={!!app.attendedAt}
                  evalFee={!!app.evalFeeReceivedAt}
                  fee={fee}
                  attendedNote={app.attendedAt ? `চিহ্নিত, ${when(app.attendedAt)}` : 'আবেদনপত্রের QR স্ক্যান করলে এই পাতা খোলে'}
                  feeNote={app.evalFeeReceivedAt ? `চিহ্নিত, ${when(app.evalFeeReceivedAt)}` : 'এখনো গৃহীত হয়নি'}
                />
              </Card>
            )}

            <Card title="কাগজপত্র">
              {documents.length ? (
                <ul className="m-0 flex list-none flex-col p-0">
                  {documents.map((d) => (
                    <li key={d.file.key} className="border-b last:border-b-0">
                      <a href={fileUrl(app.id, d.file.key)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 py-2.5 text-sm text-foreground no-underline hover:underline">
                        <span className="flex items-center gap-2.5">
                          {d.file.type === 'application/pdf' ? <FileText className="size-4 text-muted-foreground" aria-hidden /> : <ImageIcon className="size-4 text-muted-foreground" aria-hidden />}
                          {d.label}
                        </span>
                        <span className={cn(LAT, 'text-[12.5px] text-muted-foreground')}>
                          {d.file.type === 'application/pdf' ? 'PDF' : 'JPG'}, {Math.max(1, Math.round(d.file.size / 1024))} KB
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-sm text-muted-foreground">কোনো কাগজ আপলোড হয়নি।</p>
              )}
              <p className="m-0 mt-2 text-[12.5px] text-muted-foreground">ফাইলগুলো গোপন, শুধু অ্যাডমিন থেকে খোলা যায়।</p>
            </Card>

            <Card title="পেমেন্ট">
              {payments.length ? (
                <div className="flex flex-col gap-3">
                  {payments.map((p) => (
                    <div key={p.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                      <dl className="m-0 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm">
                        <dt className="text-muted-foreground">আবেদন ফি</dt>
                        <dd className="m-0">
                          {taka(p.amount, 'bengali')}{' '}
                          <span className={cn('ml-1.5 text-[12.5px]', p.status === 'valid' ? 'text-success' : p.status === 'held' ? 'text-warning' : 'text-muted-foreground')}>
                            {PAYMENT_STATUS_LABEL[p.status]}
                          </span>
                        </dd>
                        {p.cardType && (
                          <>
                            <dt className="text-muted-foreground">মাধ্যম</dt>
                            <dd className="m-0">{p.cardType}</dd>
                          </>
                        )}
                        <dt className="text-muted-foreground">Tran ID</dt>
                        <dd className={cn(LAT, 'm-0 break-all text-[13px]')}>{p.tranId}</dd>
                        {p.bankTranId && (
                          <>
                            <dt className="text-muted-foreground">Bank Tran</dt>
                            <dd className={cn(LAT, 'm-0 text-[13px]')}>{p.bankTranId}</dd>
                          </>
                        )}
                        <dt className="text-muted-foreground">সময়</dt>
                        <dd className="m-0">{when(p.completedAt ?? p.createdAt)}</dd>
                        {p.riskLevel && p.riskLevel !== '0' && (
                          <>
                            <dt className="text-muted-foreground">ঝুঁকি</dt>
                            <dd className="m-0 text-warning">SSLCommerz ঝুঁকিপূর্ণ বলেছে</dd>
                          </>
                        )}
                      </dl>
                      {p.status === 'held' && !paid && <AcceptHeld id={app.id} paymentId={p.id} />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-sm text-muted-foreground">পেমেন্টের চেষ্টা হয়নি।</p>
              )}
            </Card>

            <Card title="নোট">
              <NoteForm id={app.id} />
              {notes.map((n) => (
                <div key={n.id} className="mt-3 border-t pt-3 text-sm leading-relaxed">
                  <p className="m-0 whitespace-pre-wrap">{String((n.detail as { text?: string } | null)?.text ?? '')}</p>
                  <div className="mt-1 text-xs text-muted-foreground">{when(n.createdAt)}</div>
                </div>
              ))}
            </Card>

            <Card title="কার্যক্রম">
              <ol className="m-0 list-none p-0">
                {log.map((l) => (
                  <li key={l.id} className="grid grid-cols-[auto_1fr] gap-3 border-t py-2 text-[13.5px]">
                    <span className="whitespace-nowrap text-muted-foreground">{logWhen(l.createdAt)}</span>
                    <span>
                      {eventText(l.kind, l.label, l.detail)}
                      {l.actor === 'admin' && <span className="text-muted-foreground"> · অফিস</span>}
                    </span>
                  </li>
                ))}
              </ol>
              {events.length >= 100 && <p className="m-0 mt-2 text-xs text-muted-foreground">সাম্প্রতিক {bn(100)}টি দেখানো হচ্ছে।</p>}
            </Card>
          </div>
        </div>
      </AdmBody>
    </>
  );
}
