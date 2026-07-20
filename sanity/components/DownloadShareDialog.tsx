'use client'

import { useState } from 'react'
import { Button, Card, Flex, Select, Stack, Text, TextInput, useToast } from '@sanity/ui'
import type { DownloadLinkLifetime, DownloadScope } from '../../src/lib/downloads/types'

export function DownloadShareDialog({
  scope,
  targetId,
}: {
  scope: DownloadScope
  targetId?: string
}) {
  const [lifetime, setLifetime] = useState<DownloadLinkLifetime>(7)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function generate() {
    setBusy(true)
    setUrl('')
    try {
      const response = await fetch('/studio/api/downloads/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, targetId, lifetime }),
      })
      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url) throw new Error(result.error || 'Could not generate link')
      setUrl(result.url)
    } catch (error) {
      toast.push({
        status: 'error',
        title: error instanceof Error ? error.message : 'Could not generate link',
      })
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url)
    toast.push({ status: 'success', title: 'Share link copied' })
  }

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Text size={1}>
          The link opens the English page, grants only this scope, and can be used in either
          language after opening.
        </Text>
        <Stack space={2}>
          <Text size={1} weight="semibold">Link lifetime</Text>
          <Select
            value={lifetime}
            onChange={(event) => {
              const value = event.currentTarget.value
              setLifetime(value === 'never' ? 'never' : Number(value) as DownloadLinkLifetime)
            }}
          >
            <option value={1}>1 day</option>
            <option value={7}>7 days (default)</option>
            <option value={30}>30 days</option>
            {scope !== 'library' ? <option value="never">Never expires</option> : null}
          </Select>
        </Stack>
        {lifetime === 'never' ? (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>
              This link remains usable until an editor revokes existing links for this document.
            </Text>
          </Card>
        ) : null}
        <Button
          text={busy ? 'Generating…' : 'Generate share link'}
          tone="primary"
          disabled={busy}
          onClick={() => void generate()}
        />
        {url ? (
          <Flex gap={2}>
            <TextInput value={url} readOnly />
            <Button text="Copy" onClick={() => void copy()} />
          </Flex>
        ) : null}
      </Stack>
    </Card>
  )
}
