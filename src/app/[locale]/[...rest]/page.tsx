import { notFound } from 'next/navigation';

/** Any other address under a language: the site's 404 page (not-found.tsx), with the header and footer. */
export default function UnknownPage() {
  notFound();
}
