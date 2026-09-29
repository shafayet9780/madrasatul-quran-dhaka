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
      className="flex flex-wrap gap-x-6 gap-y-1 border-b border-[#e9e4dc] py-3"
    >
      {links.map(link => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="inline-flex min-h-11 items-center border-b border-transparent text-sm font-medium text-[#746c63] hover:text-[#352b24] hover:border-[#947856] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
