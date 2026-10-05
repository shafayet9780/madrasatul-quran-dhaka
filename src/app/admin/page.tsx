import { redirect } from 'next/navigation';

// The overview (R1) becomes the landing page once guardian reports exist (phase 2).
export default function AdminHome() {
  redirect('/admin/tracker');
}
