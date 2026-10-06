import Link from 'next/link';
import { requestOrigin } from '@/lib/survey/admin-auth';
import { formatDateTime } from '@/lib/survey/dates';
import { displayMobile } from '@/lib/survey/labels';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { roundStatus } from '@/lib/survey/round-status';
import { surveyPath } from '@/lib/survey/rounds';
import { loadGuardianTracker } from '@/lib/survey/tracker';
import { RoundPicker } from '../RoundPicker';
import { CopyReminder, PrintButton } from './TrackerControls';

const DAY = 24 * 60 * 60 * 1000;
const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });

/** Tracker for one guardian round (R6-Tracker-Guardian): progress, reminders, unverified, more than one form. */
export async function GuardianTracker({ roundId, rounds, place, now }: { roundId: string; rounds: { id: string; label: string }[]; place?: string; now: Date }) {
  const [data, origin] = await Promise.all([loadGuardianTracker(roundId), requestOrigin()]);
  if (!data) return null;
  const { round, places, done, total, verified, unverified, multiple } = data;
  const status = roundStatus(round, now);
  // A closed round's link no longer works: no reminders (extend the round on the rounds page first).
  const closed = status === 'closed';
  const daysLeft = Math.ceil((round.closesAt.getTime() - now.getTime()) / DAY);
  const when =
    status === 'open' ? `বন্ধ হতে ${bn(daysLeft)} দিন বাকি` : status === 'scheduled' ? `খুলবে ${formatDateTime(round.opensAt)}` : `বন্ধ হয়েছে ${formatDateTime(round.closesAt)}`;
  // Default: the class with the most guardians still to answer.
  const chosen = places.find((p) => `${p.classKey}|${p.sectionKey}` === place) ?? [...places].sort((a, b) => b.pending.length - a.pending.length)[0];
  const link = new URL(surveyPath(round.slug, round.linkKey), origin).toString();
  const message = (child: string) =>
    `আসসালামু আলাইকুম। ${child}-এর জন্য “${round.snapshot.template.title}” (${round.label}) এখনো জমা হয়নি। লিংক: ${link} · শেষ সময় ${dayMonth.format(round.closesAt)}। জাযাকাল্লাহু খাইরান।`;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const kpis = [
    { label: 'সাড়া', value: `${bn(done)}/${bn(total)}`, note: `${bn(percent)}% শিক্ষার্থীর অভিভাবক` },
    { label: 'যাচাইকৃত', value: bn(verified), note: 'মোবাইল ERP-র সাথে মিলেছে' },
    { label: 'অযাচাইকৃত', value: bn(unverified.length), note: 'গণ্য, তবে আলাদা দেখানো' },
    { label: 'একাধিক জমা', value: bn(multiple.length), note: 'সর্বশেষটি গণ্য' },
  ];
  const contact = (c: { fatherMobile: string | null; motherMobile: string | null }) =>
    [c.fatherMobile && `বাবা ${displayMobile(c.fatherMobile)}`, c.motherMobile && `মা ${displayMobile(c.motherMobile)}`].filter(Boolean).join(' · ');

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="sv-head" style={{ margin: 0, fontSize: 30 }}>
            রেসপন্স ট্র্যাকার
          </h1>
          <div style={{ fontSize: 14, color: 'var(--sv-text-muted)' }}>
            {round.snapshot.template.title} · {round.label} · {when}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center sv-no-print">
          <RoundPicker rounds={rounds} value={round.id} basePath="/admin/tracker" />
          <a className="sv-sbtn" href={`/admin/reports/export?kind=guardian-tracker&round=${round.id}`}>
            Excel
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        {kpis.map((k) => (
          <div key={k.label} className="sv-card flex flex-col gap-1" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>{k.label}</span>
            <span className="sv-num" style={{ fontSize: 28 }}>
              {k.value}
            </span>
            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{k.note}</span>
          </div>
        ))}
      </div>

      <nav aria-label="এই পাতায়" className="flex flex-wrap gap-2 items-center sv-no-print">
        <span style={{ fontSize: 13, color: 'var(--sv-text-muted)', marginRight: 4 }}>এই পাতায়:</span>
        <a className="sv-jump" href="#pending">
          জমা হয়নি
        </a>
        <a className="sv-jump" href="#unverified">
          অযাচাইকৃত ({bn(unverified.length)})
        </a>
        <a className="sv-jump" href="#multiple">
          একাধিক জমা ({bn(multiple.length)})
        </a>
      </nav>

      <div id="pending" className="flex flex-wrap gap-4 items-start">
        <section className="sv-card flex flex-col gap-2" style={{ flex: '1 1 340px', minWidth: 0 }} aria-labelledby="by-class">
          <h2 id="by-class" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            শ্রেণিভিত্তিক সাড়া
          </h2>
          {places.map((p) => {
            const key = `${p.classKey}|${p.sectionKey}`;
            const current = chosen && key === `${chosen.classKey}|${chosen.sectionKey}`;
            return (
              <Link
                key={key}
                href={`/admin/tracker?round=${round.id}&place=${encodeURIComponent(key)}#pending`}
                aria-current={current ? 'true' : undefined}
                className="grid items-center gap-2.5"
                style={{
                  gridTemplateColumns: '110px minmax(0, 1fr) 56px',
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${current ? 'var(--sv-bronze)' : 'var(--sv-hairline)'}`,
                  background: current ? 'var(--sv-tint)' : '#fff',
                  color: 'var(--sv-text)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.label}</span>
                <span aria-hidden="true" style={{ height: 8, borderRadius: 4, background: 'var(--sv-hairline-soft)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: 8, background: '#b86a2e', width: `${p.total ? Math.round((p.done / p.total) * 100) : 0}%` }} />
                </span>
                <span className="sv-num" style={{ fontSize: 13, textAlign: 'right' }}>
                  {bn(p.done)}/{bn(p.total)}
                </span>
              </Link>
            );
          })}
        </section>

        {chosen && (
          <section className="sv-card flex flex-col gap-3" style={{ flex: '999 1 540px', minWidth: 0 }} aria-labelledby="pending-title">
            <div className="flex flex-col gap-0.5">
              <h2 id="pending-title" className="sv-head" style={{ margin: 0, fontSize: 19 }}>
                {chosen.label} · এখনো জমা হয়নি ({bn(chosen.pending.length)})
              </h2>
              <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
                {closed
                  ? 'রাউন্ড বন্ধ, তাই বার্তা পাঠানো যাবে না। আরও সময় দিতে রাউন্ড পাতায় মেয়াদ বাড়ান।'
                  : 'প্রত্যেক অভিভাবককে আলাদা বার্তা পাঠান। গ্রুপে নাম তালিকা পাঠাবেন না। বার্তায় শুধু এই রাউন্ডের লিংক থাকে।'}
              </div>
            </div>
            {chosen.pending.length === 0 ? (
              <p className="sv-muted" style={{ margin: 0 }}>
                এই শ্রেণির সব অভিভাবক জমা দিয়েছেন।
              </p>
            ) : (
              <div role="region" aria-label="জমা হয়নি এমন শিক্ষার্থীর তালিকা" tabIndex={0} style={{ overflowX: 'auto' }}>
                <table className="sv-table" style={{ minWidth: 560 }}>
                  <thead>
                    <tr>
                      <th scope="col">শিক্ষার্থী</th>
                      <th scope="col">যোগাযোগ</th>
                      <th scope="col" style={{ textAlign: 'right' }}>
                        কাজ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chosen.pending.map((c) => (
                      <tr key={c.erpId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{c.roll !== null ? `রোল ${bn(c.roll)}` : `রোল নেই · আইডি ${bn(c.erpId)}`}</div>
                        </td>
                        <td style={{ fontSize: 13.5 }}>{contact(c) || 'কোনো নম্বর নেই'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {closed ? (
                            <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>রাউন্ড বন্ধ</span>
                          ) : c.fatherMobile || c.motherMobile ? (
                            <CopyReminder text={message(c.name)} child={c.name} />
                          ) : (
                            <span style={{ fontSize: 13, color: 'var(--sv-warn)' }}>ERP-তে নম্বর যোগ করুন</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!closed && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--sv-stone-soft)', fontSize: 14, lineHeight: 1.6 }}>
                <b>বার্তার নমুনা:</b> “{message('[শিক্ষার্থীর নাম]')}”
              </div>
            )}
          </section>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-start">
        <section id="unverified" className="sv-card flex flex-col gap-2.5" style={{ flex: '1 1 440px', minWidth: 0 }} aria-labelledby="unverified-title">
          <h2 id="unverified-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            অযাচাইকৃত জমা ({bn(unverified.length)})
          </h2>
          <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>প্রদানকারীর মোবাইল ERP-র বাবা বা মায়ের নম্বরের সাথে মেলেনি। জমা গণ্য হয়েছে; রিপোর্টে “শুধু যাচাইকৃত” ফিল্টারে বাদ যায়।</div>
          {unverified.length === 0 && <p className="sv-muted" style={{ margin: 0 }}>নেই।</p>}
          {unverified.map((f) => (
            <div key={f.submissionId} className="flex flex-col" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)' }}>
              <span style={{ fontWeight: 600 }}>
                {f.who} ({f.relation}) · {f.child.name}
              </span>
              <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
                {f.place} · {displayMobile(f.mobile)} · {formatDateTime(f.submittedAt)}
              </span>
            </div>
          ))}
        </section>
        <section id="multiple" className="sv-card flex flex-col gap-2.5" style={{ flex: '1 1 440px', minWidth: 0 }} aria-labelledby="multiple-title">
          <h2 id="multiple-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            একাধিক জমা ({bn(multiple.length)})
          </h2>
          <div style={{ fontSize: 13.5, color: 'var(--sv-text-muted)' }}>
            একই শিক্ষার্থীর জন্য একাধিক রিভিউ এসেছে। সর্বশেষটি গণ্য হয়; আগেরগুলো রাখা আছে। গণ্য ফর্মটি অন্য নম্বর থেকে এলে চিহ্নিত থাকে — অস্বাভাবিক মনে হলে অভিভাবককে ফোন করুন।
          </div>
          {multiple.length === 0 && <p className="sv-muted" style={{ margin: 0 }}>নেই।</p>}
          {multiple.map((m) => (
            <div key={m.child.erpId} className="flex flex-col gap-1.5" style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sv-hairline)' }}>
              <div className="flex justify-between gap-2">
                <span style={{ fontWeight: 600 }}>{m.child.name}</span>
                <span style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>{m.place}</span>
              </div>
              {m.forms.map((f) => (
                <div key={f.submissionId} className="flex flex-wrap items-center gap-2" style={{ fontSize: 13.5 }}>
                  <span className={`sv-chip ${f.current ? 'is-ok' : 'is-muted'}`}>{f.current ? 'গণ্য' : 'আগের'}</span>
                  <span>
                    {f.who} ({f.relation}) · {displayMobile(f.mobile)} · {f.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}
                  </span>
                  <span style={{ color: 'var(--sv-text-muted)' }}>{formatDateTime(f.submittedAt)}</span>
                  {f.current && m.forms.some((o) => !o.current && o.mobile !== f.mobile) && <span className="sv-chip is-warn">আগের ফর্ম অন্য নম্বর থেকে</span>}
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
