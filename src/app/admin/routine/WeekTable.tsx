import type { ReactNode } from 'react';
import { DAY_NAMES, DAYS, spanText } from '@/lib/routine/days';
import type { TimeSpan } from '@/lib/routine/types';

// One group's or one teacher's week: days down, its times across (A4 landscape on paper).

export function WeekTable({ times, cell, label }: { times: TimeSpan[]; cell: (day: number, time: TimeSpan) => ReactNode; label: string }) {
  return (
    <div className="rt-scroll overflow-x-auto rounded-xl border bg-card">
      <table className="rt-grid w-full" aria-label={label}>
        <thead>
          <tr>
            <th scope="col" className="text-left">
              দিন
            </th>
            {times.map((t) => (
              <th key={`${t.startsAt}-${t.endsAt}`} scope="col" className="text-left">
                {spanText(t)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <th scope="row">{DAY_NAMES[day]}</th>
              {times.map((t) => (
                <td key={`${t.startsAt}-${t.endsAt}`}>
                  <div className="rt-cell">{cell(day, t)}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
