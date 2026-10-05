'use client'

import { useState } from 'react'
import type { DocumentActionComponent } from 'sanity'
import { OpenRoundDialog } from '../components/OpenRoundDialog'

export const OpenRoundAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false)
  const ready = Boolean(props.published) && !props.draft

  return {
    label: 'Open round',
    disabled: !ready,
    title: ready ? undefined : 'Publish the round (with no unpublished changes) before opening it',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      header: 'Open survey round',
      content: <OpenRoundDialog sanityRoundId={props.id} />,
      onClose: () => setOpen(false),
    },
  }
}
