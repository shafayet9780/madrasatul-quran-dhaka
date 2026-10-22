import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/**
 * The public site's link: a page loads when it is opened, not in the background as its links come into view. Next's
 * default fetched every page linked from the screen (about 13 on a wide screen), spending parents' mobile data and
 * competing with the page's first photo. The pages are cached, so they still open quickly.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
