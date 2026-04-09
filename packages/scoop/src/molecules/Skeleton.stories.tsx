import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Molecules/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: { className: 'h-4 w-48' },
}

export const CardPlaceholder: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
}

export const TextLines: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  ),
}

export const Glass: Story = {
  render: () => (
    <div
      className="rounded-xl p-6"
      style={{
        background:
          'linear-gradient(120deg, oklch(0.75 0.08 200 / 0.3), oklch(0.9 0 0))',
      }}
    >
      <Skeleton variant="glass" className="h-32 w-full max-w-md" />
    </div>
  ),
}
