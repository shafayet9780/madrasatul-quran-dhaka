'use client'

import { useState } from 'react'
import { useToast } from '@sanity/ui'
import {
  getDraftId,
  getPublishedId,
  useClient,
  type DocumentActionComponent,
} from 'sanity'

export const RevokeDownloadLinksAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  return {
    label: busy ? 'Revoking share links…' : 'Revoke existing share links',
    disabled: !props.published || busy,
    title: props.published
      ? 'Invalidates all current links generated for this document'
      : 'Publish this document before revoking links',
    onHandle: async () => {
      if (!window.confirm('Invalidate all current share links for this document?')) return

      setBusy(true)
      try {
        const publishedId = getPublishedId(props.id)
        let transaction = client
          .transaction()
          .patch(publishedId, (patch) =>
            patch.setIfMissing({ shareVersion: 1 }).inc({ shareVersion: 1 }),
          )

        if (props.draft) {
          transaction = transaction.patch(getDraftId(publishedId), (patch) =>
            patch.setIfMissing({ shareVersion: 1 }).inc({ shareVersion: 1 }),
          )
        }

        await transaction.commit()
        toast.push({ status: 'success', title: 'Existing share links revoked' })
        props.onComplete()
      } catch (error) {
        toast.push({
          status: 'error',
          title: error instanceof Error ? error.message : 'Could not revoke share links',
        })
      } finally {
        setBusy(false)
      }
    },
  }
}
