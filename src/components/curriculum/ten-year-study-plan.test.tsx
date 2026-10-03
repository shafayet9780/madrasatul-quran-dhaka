import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import StudyPlan from './ten-year-study-plan';
import messages from '../../../messages/english.json';

describe('period-grid semantics', () => {
  it('renders eight distinct slots and retains intentional gaps and merged rows', () => {
    render(
      <NextIntlClientProvider locale="english" messages={messages}>
        <StudyPlan />
      </NextIntlClientProvider>
    );
    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', { name: 'Islamic studies' })
    ).toHaveAttribute('colspan', '3');
    expect(
      within(table).getByRole('columnheader', { name: 'General subjects' })
    ).toHaveAttribute('colspan', '5');
    expect(
      within(table).getAllByRole('columnheader', { name: /Period \d/ })
    ).toHaveLength(8);
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(12);
    expect(rows[0].children).toHaveLength(10);
    expect(rows[0].querySelectorAll('td .sr-only')).toHaveLength(2);
    expect(rows[7].children[2]).toHaveTextContent('No subject assigned');
    expect(rows[10].querySelector('td[colspan="3"]')).toHaveTextContent(
      'SSC/DAKHIL'
    );
    expect(rows[10].querySelector('td[colspan="5"]')).toHaveTextContent(
      'SSC/DAKHIL'
    );
  });
});
