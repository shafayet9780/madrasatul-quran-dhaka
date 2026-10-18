import type { ReactNode } from 'react';
import { DAY_NAMES, DAYS, periodTime } from '@/lib/routine/days';
import type { Period } from '@/lib/routine/types';

// One group's or one teacher's week: days down, periods across (A4 landscape on paper).

export function WeekTable({ periods, cell, label }: { periods: Period[]; cell: (day: number, period: Period) => ReactNode; label: string }) {
  return (
    <div className="rt-scroll overflow-x-auto rounded-xl border bg-card">
      <table className="rt-grid w-full" aria-label={label}>
        <thead>
          <tr>
            <th scope="col" className="text-left">
              দিন
            </th>
            {periods.map((p) => (
              <th key={p.id} scope="col" className="text-left">
                {periodTime(p)}
                {p.label && <div className="text-[11.5px] font-normal text-muted-foreground">{p.label}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <th scope="row">{DAY_NAMES[day]}</th>
              {periods.map((p) => (
                <td key={p.id}>
                  <div className="rt-cell">{cell(day, p)}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
