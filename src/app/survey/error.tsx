'use client';

// Unexpected failure while loading a survey page (e.g. the database waking up too slowly).
export default function SurveyError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="sv-screen" style={{ justifyContent: 'center', padding: '0 28px' }}>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="sv-head sv-h1">পাতাটি খোলা যায়নি</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: 'var(--sv-text-muted)' }}>
          একটু পরে আবার চেষ্টা করুন। আপনার দেওয়া মার্ক ও উত্তর সংরক্ষিত আছে।
        </p>
        <button type="button" className="sv-cta" style={{ maxWidth: 320 }} onClick={() => reset()}>
          আবার চেষ্টা করুন
        </button>
      </div>
    </main>
  );
}
