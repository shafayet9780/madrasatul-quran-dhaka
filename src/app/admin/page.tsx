import { redirect } from 'next/navigation';

// The overview is the landing page.
export default function AdminHome() {
  redirect('/admin/reports/overview');
}
