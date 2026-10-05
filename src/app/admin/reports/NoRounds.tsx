import Link from 'next/link';

export function NoRounds() {
  return (
    <div className="sv-card" style={{ padding: 20 }}>
      এখনো কোনো শিক্ষক রিভিউ (T1) রাউন্ড খোলা হয়নি। <Link href="/admin/rounds">রাউন্ড পাতায়</Link> গিয়ে একটি রাউন্ড খুলুন।
    </div>
  );
}
