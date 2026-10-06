/** Report filters as a plain GET form (works without JavaScript); "দেখান" applies them. */
export function ReportFilters({
  action,
  selects,
  verifiedOnly,
}: {
  action: string;
  selects: { name: string; label: string; value: string; options: { value: string; label: string }[] }[];
  verifiedOnly?: boolean;
}) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3 sv-no-print" aria-label="ফিল্টার">
      {selects.map((s) => (
        <label key={s.name} className="flex flex-col gap-1" style={{ fontSize: 13, color: 'var(--sv-text-muted)' }}>
          {s.label}
          <select className="sv-input" name={s.name} defaultValue={s.value} style={{ height: 38, width: 'auto', minWidth: 150, fontSize: 14 }}>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {verifiedOnly !== undefined && (
        <label className="flex items-center gap-2" style={{ fontSize: 14, minHeight: 38 }}>
          <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} style={{ width: 18, height: 18 }} />
          শুধু যাচাইকৃত
        </label>
      )}
      <button type="submit" className="sv-sbtn is-primary" style={{ height: 38 }}>
        দেখান
      </button>
    </form>
  );
}
