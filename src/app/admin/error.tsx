'use client';

import { Button } from '@/components/shadcn/button';
import { PageTop } from './AdminShell';
import { PageBody } from './ui';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <PageTop crumbs={[{ label: 'সমস্যা' }]} round={false} />
      <PageBody>
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5" role="alert">
          <h1 className="m-0 text-lg font-semibold">পাতাটি খোলা যায়নি</h1>
          <p className="m-0 text-sm text-muted-foreground">
            ডেটাবেস বা Studio থেকে তথ্য আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন; বারবার হলে ডেভেলপারকে জানান
            {error.digest ? ` (কোড: ${error.digest})` : ''}।
          </p>
          <div>
            <Button type="button" variant="outline" className="h-9 bg-white shadow-none" onClick={() => reset()}>
              আবার চেষ্টা করুন
            </Button>
          </div>
        </section>
      </PageBody>
    </>
  );
}
