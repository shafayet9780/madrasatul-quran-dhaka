'use client';

import { PageTop } from './AdminShell';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <PageTop crumbs={[{ label: 'সমস্যা' }]} round={false} />
    <div className="sv-card flex flex-col gap-3" role="alert" style={{ padding: 20 }}>
      <h1 className="sv-head sv-h2">পাতাটি খোলা যায়নি</h1>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--sv-text-muted)' }}>
        ডেটাবেস বা Studio থেকে তথ্য আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন; বারবার হলে ডেভেলপারকে জানান
        {error.digest ? ` (কোড: ${error.digest})` : ''}।
      </p>
      <div>
        <button type="button" className="sv-sbtn" onClick={() => reset()}>
          আবার চেষ্টা করুন
        </button>
      </div>
    </div>
    </>
  );
}
