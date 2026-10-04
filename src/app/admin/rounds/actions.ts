'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAdmin } from '@/lib/survey/admin-auth';
import { fromDhakaInput } from '@/lib/survey/dates';
import { closeRound, openRound, refreshRoundLists, setClosesAt } from '@/lib/survey/rounds';
import type { ActionResult } from './types';

const roundId = z.uuid();
const sanityRoundId = z.string().min(1).refine((id) => !id.startsWith('drafts.'));
const invalid: ActionResult = { ok: false, errors: ['অনুরোধটি সঠিক নয়; পাতাটি আবার লোড করুন।'] };

function done(message: string): ActionResult {
  revalidatePath('/admin/rounds');
  return { ok: true, message };
}

export async function openRoundAction(id: string, opensAtInput: string, closesAtInput: string): Promise<ActionResult> {
  await assertAdmin();
  if (!sanityRoundId.safeParse(id).success) return invalid;
  const opensAt = fromDhakaInput(opensAtInput);
  const closesAt = fromDhakaInput(closesAtInput);
  if (!opensAt || !closesAt) return { ok: false, errors: ['খোলা ও বন্ধের সময় দিন।'] };
  const result = await openRound(id, { dates: { opensAt, closesAt } });
  if (!result.ok) return result;
  return done(result.alreadyOpen ? 'রাউন্ডটি আগেই খোলা হয়েছিল।' : 'রাউন্ড খোলা হয়েছে। লিংক কপি করে শেয়ার করুন।');
}

export async function extendRoundAction(id: string, closesAtInput: string): Promise<ActionResult> {
  await assertAdmin();
  if (!roundId.safeParse(id).success) return invalid;
  const closesAt = fromDhakaInput(closesAtInput);
  if (!closesAt) return { ok: false, errors: ['নতুন বন্ধের সময় দিন।'] };
  const error = await setClosesAt(id, closesAt);
  return error ? { ok: false, errors: [error] } : done('মেয়াদ বাড়ানো হয়েছে।');
}

export async function closeRoundAction(id: string): Promise<ActionResult> {
  await assertAdmin();
  if (!roundId.safeParse(id).success) return invalid;
  await closeRound(id);
  return done('রাউন্ড বন্ধ হয়েছে। খসড়াগুলো রাখা আছে; মেয়াদ বাড়ালে আবার জমা দেওয়া যাবে।');
}

export async function refreshListsAction(id: string): Promise<ActionResult> {
  await assertAdmin();
  if (!roundId.safeParse(id).success) return invalid;
  const result = await refreshRoundLists(id);
  return result.ok ? done('শ্রেণি, বিষয় ও শিক্ষক তালিকা হালনাগাদ হয়েছে।') : result;
}
