import type { Locale } from '@/lib/i18n';
import { num } from '@/lib/admissions/display';

export type AdmissionStep = { title: string; note: string; list: string[] };

/**
 * How admission works, on `paper`: the pre-admission page's six steps, numbered in the page's digits. Step 5 lists
 * what to bring on assessment day (Studio → Pre-admission form → Cycle settings).
 */
export function AdmissionSteps({ locale, title, steps }: { locale: Locale; title: string; steps: AdmissionStep[] }) {
  return (
    <section id="steps" className="bg-paper text-ink">
      <div className="page-wrap flex flex-col gap-9 py-section">
        <h2 className="m-0 text-h2 text-balance">{title}</h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-10 gap-y-9 p-0">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 border-t border-line-strong pt-5">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-17 font-heading text-rust-deep">
                {num(i + 1, locale)}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5 pt-1.5">
                <h3 className="m-0 text-19 leading-[1.35] font-bold">{s.title}</h3>
                <p className="m-0 text-16 text-ink-body">{s.note}</p>
                {s.list.length > 0 && (
                  <ul className="m-0 mt-1 flex list-disc flex-col gap-1 pl-5 text-16 leading-[1.55] text-ink-body marker:text-rust">
                    {s.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
