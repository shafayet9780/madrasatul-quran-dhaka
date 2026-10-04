'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Flex, Spinner, Stack, Text, TextInput, useToast } from '@sanity/ui'

type Summary = { questions: number; classSections: number; t1Pairs: number; areas: number; teachers: number }
type Result =
  | { ok: true; alreadyOpen: boolean; dryRun: boolean; summary: Summary; url?: string }
  | { ok: false; errors: string[] }

async function call(sanityRoundId: string, dryRun: boolean): Promise<Result> {
  const response = await fetch('/studio/api/survey/rounds/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sanityRoundId, dryRun }),
  })
  const body = await response.json().catch(() => ({}))
  if (response.ok || response.status === 422) return body as Result
  return { ok: false, errors: [body.error || `Request failed (${response.status})`] }
}

export function OpenRoundDialog({ sanityRoundId }: { sanityRoundId: string }) {
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let active = true
    call(sanityRoundId, true)
      .catch((error: Error) => ({ ok: false as const, errors: [error.message] }))
      .then((r) => active && setResult(r))
    return () => {
      active = false
    }
  }, [sanityRoundId])

  async function openNow() {
    setBusy(true)
    try {
      setResult(await call(sanityRoundId, false))
    } catch (error) {
      setResult({ ok: false, errors: [(error as Error).message] })
    } finally {
      setBusy(false)
    }
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url)
    toast.push({ status: 'success', title: 'Survey link copied' })
  }

  if (!result) {
    return (
      <Card padding={4}>
        <Flex align="center" gap={3}>
          <Spinner muted />
          <Text size={1}>Checking the round…</Text>
        </Flex>
      </Card>
    )
  }

  if (!result.ok) {
    return (
      <Card padding={4}>
        <Stack space={3}>
          <Text size={1} weight="semibold">This round cannot be opened yet:</Text>
          <Card padding={3} radius={2} tone="critical">
            <Stack space={2}>
              {result.errors.map((error) => (
                <Text key={error} size={1}>{error}</Text>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Card>
    )
  }

  const { summary } = result
  return (
    <Card padding={4}>
      <Stack space={4}>
        {result.url ? (
          <Card padding={3} radius={2} tone="positive">
            <Text size={1}>{result.alreadyOpen ? 'This round is already open.' : 'The round is open.'} Share this link:</Text>
          </Card>
        ) : (
          <Text size={1}>
            Opening copies these into the round. Later edits in Studio do not change it; dates are managed on the admin
            rounds page.
          </Text>
        )}
        <Stack space={2}>
          <Text size={1}>· {summary.questions} questions</Text>
          <Text size={1}>· {summary.classSections} class-sections ({summary.t1Pairs} class-subject pairs)</Text>
          <Text size={1}>· {summary.teachers} teachers, {summary.areas} areas</Text>
        </Stack>
        {result.url ? (
          <Stack space={3}>
            <Flex gap={2}>
              <TextInput value={result.url} readOnly />
              <Button text="Copy" onClick={() => void copy(result.url!)} />
            </Flex>
            <Text size={1}>
              <a href="/admin/rounds" target="_blank" rel="noreferrer">Manage dates on the admin rounds page →</a>
            </Text>
          </Stack>
        ) : (
          <Button text={busy ? 'Opening…' : 'Open round'} tone="primary" disabled={busy} onClick={() => void openNow()} />
        )}
      </Stack>
    </Card>
  )
}
