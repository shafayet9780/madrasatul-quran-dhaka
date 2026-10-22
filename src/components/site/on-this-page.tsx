/** Links to each section of a page, under its opening ("এই পৃষ্ঠায়" / "On this page"). */
export function OnThisPage({ label, links }: { label: string; links: { id: string; label: string }[] }) {
  return (
    <nav aria-labelledby="on-this-page" className="flex flex-wrap items-center gap-x-7 gap-y-1 border-t border-line pt-3">
      <span id="on-this-page" className="text-14 font-strong text-ink-muted">
        {label}
      </span>
      {links.map((l) => (
        <a
          key={l.id}
          href={`#${l.id}`}
          className="inline-flex min-h-11 min-w-6 items-center justify-center text-16 font-strong text-ink underline decoration-line-sand underline-offset-[6px] hover:text-rust hover:decoration-rust focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}
