import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { get, valuesGet, append } = vi.hoisted(() => ({
  get: vi.fn(),
  valuesGet: vi.fn(),
  append: vi.fn(),
}))

vi.mock('@/lib/google-sheets-server', () => ({
  sheetsConfigured: () => true,
  getSheetsClient: () => ({ spreadsheets: { get, values: { get: valuesGet, append } } }),
}))

import { POST } from './route'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

function submit(body: Record<string, unknown>) {
  return POST(
    new NextRequest('https://school.test/api/submit-form', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  )
}

describe('pre-admission submit', () => {
  it('writes to the server-configured sheet, ignoring a spreadsheetId in the request', async () => {
    vi.stubEnv('FORM_GOOGLE_SHEETS_ID', 'configured-sheet')
    append.mockResolvedValue({ data: {} })
    const response = await submit({ data: ['a'], range: 'A:Z', spreadsheetId: 'attacker-sheet' })
    expect(response.status).toBe(200)
    expect(get).toHaveBeenCalledWith({ spreadsheetId: 'configured-sheet' })
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ spreadsheetId: 'configured-sheet' }))
  })

  it('fails without touching Sheets when no sheet is configured', async () => {
    vi.stubEnv('FORM_GOOGLE_SHEETS_ID', '')
    const response = await submit({ data: ['a'], range: 'A:Z', spreadsheetId: 'attacker-sheet' })
    expect(response.status).toBe(500)
    expect(get).not.toHaveBeenCalled()
    expect(append).not.toHaveBeenCalled()
  })
})
