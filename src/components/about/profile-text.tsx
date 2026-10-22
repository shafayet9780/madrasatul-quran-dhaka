import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { cn } from '@/lib/utils';

const heading = 'm-0 mt-3 text-h4 text-ink';

// Studio's rich text in the site's styles. The section already has its H2 (বাণী, জীবনী), so the text's own
// headings start at H3.
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="m-0">{children}</p>,
    h1: ({ children }) => <h3 className={heading}>{children}</h3>,
    h2: ({ children }) => <h3 className={heading}>{children}</h3>,
    h3: ({ children }) => <h3 className={heading}>{children}</h3>,
    h4: ({ children }) => <h4 className="m-0 mt-1 text-18 font-bold text-ink">{children}</h4>,
    // A rule, not a card: the message section is already on `cream`.
    blockquote: ({ children }) => <blockquote className="m-0 border-l-[3px] border-line-strong pl-5 text-ink">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className="m-0 flex list-disc flex-col gap-1.5 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-6">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
    link: ({ children, value }) => {
      const href: string = value?.href ?? '';
      const external = /^https?:/.test(href);
      return (
        <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="text-rust underline underline-offset-4 hover:text-rust-deep">
          {children}
        </a>
      );
    },
  },
};

/** A profile's message or biography from Studio, in a reading column (about 40em) of 18px `ink-body` text. */
export function ProfileText({ value, className }: { value: PortableTextBlock[]; className?: string }) {
  return (
    <div className={cn('flex max-w-[40em] flex-col gap-4 whitespace-pre-line text-18 leading-[1.75] text-ink-body', className)}>
      <PortableText value={value} components={components} />
    </div>
  );
}
