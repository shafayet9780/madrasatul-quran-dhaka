import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { authorize, openRound } = vi.hoisted(() => ({ authorize: vi.fn(), openRound: vi.fn() }))

vi.mock('@/lib/studio-auth', () => ({ isAuthorizedStudioAdminRequest: authorize }))
vi.mock('@/lib/survey/rounds', () => ({
  openRound,
  surveyPath: (slug: string, key: string) => `/survey/${slug}?k=${key}`,
}))

import { POST } from './route'

afterEach(() => vi.clearAllMocks())

function request(body: unknown) {
  return new NextRequest('https://school.test/studio/api/survey/rounds/open', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const summary = { questions: 7, classSections: 13, t1Pairs: 60, areas: 6, teachers: 20 }

describe('Studio open-round route', () => {
  it('requires the Studio login', async () => {
    authorize.mockReturnValue(false)
    expect((await POST(request({ sanityRoundId: 'round-1' }))).status).toBe(401)
    expect(openRound).not.toHaveBeenCalled()
  })

  it('rejects draft ids and missing ids', async () => {
    authorize.mockReturnValue(true)
    expect((await POST(request({ sanityRoundId: 'drafts.round-1' }))).status).toBe(400)
    expect((await POST(request({}))).status).toBe(400)
    expect(openRound).not.toHaveBeenCalled()
  })

  it('opens the round and returns the link without exposing the key separately', async () => {
    authorize.mockReturnValue(true)
    openRound.mockResolvedValue({ ok: true, alreadyOpen: false, roundId: 'r1', slug: 't1-2026-10', linkKey: 'secret', summary })
    const response = await POST(request({ sanityRoundId: 'round-1' }))
    const body = await response.json()
    expect(openRound).toHaveBeenCalledWith('round-1', { dryRun: false })
    expect(body).toEqual({ ok: true, alreadyOpen: false, roundId: 'r1', slug: 't1-2026-10', summary, url: 'https://school.test/survey/t1-2026-10?k=secret' })
  })

  it('passes dry runs through and returns validation errors as 422', async () => {
    authorize.mockReturnValue(true)
    openRound.mockResolvedValue({ ok: false, errors: ['কোনো সক্রিয় শিক্ষক নেই'] })
    const response = await POST(request({ sanityRoundId: 'round-1', dryRun: true }))
    expect(openRound).toHaveBeenCalledWith('round-1', { dryRun: true })
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ ok: false, errors: ['কোনো সক্রিয় শিক্ষক নেই'] })
  })
})
