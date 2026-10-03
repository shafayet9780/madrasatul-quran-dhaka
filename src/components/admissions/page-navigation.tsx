export function PageNavigation({
  links,
  label,
}: {
  links: Array<{ id: string; label: string }>;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="flex flex-wrap gap-x-6 gap-y-1 border-b border-gray-200 py-3"
    >
      {links.map(link => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="inline-flex min-h-11 items-center border-b border-transparent text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
