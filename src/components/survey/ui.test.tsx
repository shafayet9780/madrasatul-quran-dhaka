import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkTrack } from './ui';

const marks = [10, 8, 6, 4];
const radio = (name: string) => screen.getByRole('radio', { name: new RegExp(`^${name} মার্ক`) });

describe('MarkTrack withdrawal', () => {
  it('a tap on the selected mark withdraws it', () => {
    const onClear = vi.fn();
    render(<MarkTrack marks={marks} value={8} onChange={vi.fn()} onClear={onClear} />);
    fireEvent.click(radio('৮'), { detail: 1 });
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('a double tap keeps the mark', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const { rerender } = render(<MarkTrack marks={marks} value={undefined} onChange={onChange} onClear={onClear} />);
    fireEvent.click(radio('৮'), { detail: 1 });
    rerender(<MarkTrack marks={marks} value={8} onChange={onChange} onClear={onClear} />);
    fireEvent.click(radio('৮'), { detail: 2 });
    expect(onChange).toHaveBeenCalledWith(8);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('Space/Enter confirms the selected mark; Delete withdraws it', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<MarkTrack marks={marks} value={8} onChange={onChange} onClear={onClear} />);
    fireEvent.click(radio('৮'), { detail: 0 });
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.keyDown(radio('৮'), { key: 'Delete' });
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('never withdraws without onClear (guardian form)', () => {
    const onChange = vi.fn();
    render(<MarkTrack marks={marks} value={8} onChange={onChange} />);
    fireEvent.click(radio('৮'), { detail: 1 });
    expect(onChange).toHaveBeenCalledWith(8);
  });
});
