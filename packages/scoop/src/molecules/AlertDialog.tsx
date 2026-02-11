'use client'

import * as React from 'react'
import { Dialog } from './Dialog'
import { Button } from '../atoms/Button'

export interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message: string
  /** Button label. Default: "OK" */
  confirmLabel?: string
  /** Called when user clicks OK (after closing). */
  onClose?: () => void
}

export function AlertDialog({
  open,
  onOpenChange,
  title = '',
  message,
  confirmLabel = 'OK',
  onClose,
}: AlertDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false)
    onClose?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button type="button" onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      }
    >
      <p className="text-sm text-foreground">{message}</p>
    </Dialog>
  )
}
