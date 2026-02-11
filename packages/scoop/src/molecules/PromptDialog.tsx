'use client'

import * as React from 'react'
import { Dialog } from './Dialog'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { Label } from '../atoms/Label'

export interface PromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  label: string
  defaultValue?: string
  placeholder?: string
  submitLabel?: string
  cancelLabel?: string
  /** Error message to show under the input (e.g. validation). */
  error?: string
  /** Called with the current input value when user submits. Return false to keep dialog open (e.g. validation failed). */
  onSubmit: (value: string) => void | boolean
  /** Called when user cancels (close without submit). */
  onCancel?: () => void
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  label,
  defaultValue = '',
  placeholder,
  submitLabel = 'OK',
  cancelLabel = 'Annuler',
  error,
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = React.useState(defaultValue)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open, defaultValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    const result = onSubmit(trimmed)
    if (result !== false) onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" form="prompt-dialog-form">
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="prompt-dialog-form" onSubmit={handleSubmit}>
        <Label htmlFor="prompt-dialog-input">{label}</Label>
        <Input
          id="prompt-dialog-input"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="mt-2"
          error={!!error}
          aria-invalid={!!error}
          aria-describedby={error ? 'prompt-dialog-error' : undefined}
        />
        {error ? (
          <p id="prompt-dialog-error" className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
