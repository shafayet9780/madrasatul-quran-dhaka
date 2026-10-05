'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAdmin } from '@/lib/survey/admin-auth';
import { resolveDuplicate } from '@/lib/survey/tracker';

const input = z.object({ roundId: z.uuid(), batchIds: z.array(z.uuid()).min(2).max(10), keepId: z.uuid().nullable() });

export async function resolveDuplicateAction(roundId: string, batchIds: string[], keepId: string | null) {
  await assertAdmin();
  const parsed = input.safeParse({ roundId, batchIds, keepId });
  if (!parsed.success) return { ok: false as const, error: 'অনুরোধটি সঠিক নয়; পাতাটি আবার লোড করুন।' };
  const error = await resolveDuplicate(roundId, batchIds, keepId);
  if (error) return { ok: false as const, error };
  revalidatePath('/admin/tracker');
  return { ok: true as const };
}
