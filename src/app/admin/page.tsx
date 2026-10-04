import { redirect } from 'next/navigation';

// The overview (R1) becomes the landing page once reports exist.
export default function AdminHome() {
  redirect('/admin/rounds');
}
