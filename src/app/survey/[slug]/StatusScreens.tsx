import { formatDateTime } from '@/lib/survey/dates';
import { toBengaliDigits } from '@/lib/survey/normalise';
import type { OfficePhone } from '@/lib/survey/sanity-source';

// Full-page states shown instead of a survey (G-Closed and Survey-States artboards).

export function OfficeContact({ phone, prefix = 'সমস্যা থাকলে অফিসে যোগাযোগ করুন' }: { phone: OfficePhone | null; prefix?: string }) {
  if (!phone) return null;
  const digits = phone.number.replace(/[^\d+]/g, '');
  return (
    <div style={{ background: '#fff', border: '1px solid var(--sv-hairline)', borderRadius: 16, padding: '14px 18px', fontSize: 15, lineHeight: 1.6, color: 'var(--sv-text-muted)' }}>
      {prefix}
      <br />
      <a href={`tel:${digits}`} style={{ color: 'var(--sv-text)', fontWeight: 600, textDecoration: 'none' }}>
        {toBengaliDigits(phone.number)}
      </a>
      {phone.label && <span> · {phone.label}</span>}
    </div>
  );
}

function StatePage({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <main className="sv-screen">
      <div className="flex items-center gap-2.5" style={{ padding: '22px 20px 6px' }}>
        <div className="sv-logo" aria-hidden="true">
          ম
        </div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>মাদরাসাতুল কুরআন, ঢাকা</div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 text-center" style={{ flex: 1, padding: '0 28px 80px' }}>
        <div
          aria-hidden="true"
          className="flex items-center justify-center"
          style={{ width: 76, height: 76, borderRadius: 24, background: 'var(--sv-hairline)' }}
        >
          {icon}
        </div>
        <h1 className="sv-head sv-h1">{title}</h1>
        {children}
      </div>
    </main>
  );
}

const clockIcon = (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--sv-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const linkIcon = (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--sv-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    <path d="m3 3 18 18" />
  </svg>
);
const text = { margin: 0, fontSize: 16, lineHeight: 1.65, color: 'var(--sv-text-muted)' } as const;

export function LinkInvalid({ phone }: { phone: OfficePhone | null }) {
  return (
    <StatePage icon={linkIcon} title="লিংকটি সঠিক নয়">
      <p style={text}>মাদরাসা থেকে পাঠানো পুরো লিংকটি আবার খুলুন।</p>
      <OfficeContact phone={phone} />
    </StatePage>
  );
}

export function NotOpenYet({ opensAt }: { opensAt: Date }) {
  return (
    <StatePage icon={clockIcon} title="এই রিভিউ এখনো শুরু হয়নি">
      <p style={text}>শুরু হবে {formatDateTime(opensAt)}। তখন এই একই লিংকে আসুন।</p>
    </StatePage>
  );
}

export function RoundClosed({ label, closesAt, phone }: { label: string; closesAt: Date; phone: OfficePhone | null }) {
  return (
    <StatePage icon={clockIcon} title="এই রাউন্ডের সময় শেষ হয়েছে">
      <p style={text}>
        {label} রাউন্ড {formatDateTime(closesAt)}-এ বন্ধ হয়েছে। খসড়া সংরক্ষিত আছে; অ্যাডমিন সময় বাড়ালে এই লিংক থেকেই জমা দিতে পারবেন। পরবর্তী রাউন্ডের লিংক মাদরাসা থেকে পাঠানো হবে।
      </p>
      <OfficeContact phone={phone} prefix="জরুরি প্রয়োজনে অফিসে যোগাযোগ করুন" />
    </StatePage>
  );
}
