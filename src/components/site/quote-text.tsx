import { Fragment } from 'react';

/** A quotation's text with each danda set in Anek Bangla, as the canvas does: it reads better than Tiro Bangla's beside Tiro text. */
export function QuoteText({ text }: { text: string }) {
  const parts = text.split('।');
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <span className="-ml-[0.06em] font-sans">।</span>}
    </Fragment>
  ));
}
