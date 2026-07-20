'use client'

import { useState } from 'react'
import type { DocumentActionComponent } from 'sanity'
import { DownloadShareDialog } from '../components/DownloadShareDialog'

export const ShareDownloadAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false)
  const scope = props.type === 'downloadCategory' ? 'category' : 'item'

  return {
    label: 'Generate share link',
    disabled: !props.published,
    title: props.published ? undefined : 'Publish this document before sharing it',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      header: 'Generate share link',
      content: <DownloadShareDialog scope={scope} targetId={props.id} />,
      onClose: () => setOpen(false),
    },
  }
}
