import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="sv-card flex flex-col gap-2" style={{ padding: 20 }}>
      <h1 className="sv-head sv-h2">পাতাটি পাওয়া যায়নি</h1>
      <Link href="/admin/tracker">রেসপন্স ট্র্যাকারে ফিরুন</Link>
    </div>
  );
}
