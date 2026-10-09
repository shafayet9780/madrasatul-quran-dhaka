'use client';

import { useActionState } from 'react';
import { Button } from '@/components/shadcn/button';
import { checkInAction, type CheckInState } from '../actions';

/** Type an application ID (or scan the PDF's office QR with a barcode scanner) to open it. */
export function CheckInForm() {
  const [state, action, pending] = useActionState<CheckInState, FormData>(checkInAction, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="checkin-id" className="text-sm font-medium">
        আবেদন আইডি
      </label>
      <div className="flex gap-2">
        <input
          id="checkin-id"
          name="id"
          defaultValue={state.query}
          key={state.query}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="যেমন KG-017"
          aria-invalid={!!state.error}
          aria-describedby={state.error ? 'checkin-error' : undefined}
          className="h-11 w-full max-w-[280px] rounded-lg border bg-white px-3 text-base [font-family:var(--font-english)] aria-invalid:border-destructive"
        />
        <Button type="submit" className="h-11 px-5" disabled={pending}>
          খুলুন
        </Button>
      </div>
      {state.error && (
        <p id="checkin-error" role="alert" className="m-0 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
