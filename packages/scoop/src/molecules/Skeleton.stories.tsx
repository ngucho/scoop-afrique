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
