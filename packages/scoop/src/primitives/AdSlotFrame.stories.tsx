import type { Meta, StoryObj } from '@storybook/react'
import { AdSlotFrame } from './AdSlotFrame'
import { Skeleton } from '../molecules/Skeleton'

const meta: Meta<typeof AdSlotFrame> = {
  title: 'Primitives/AdSlotFrame',
  component: AdSlotFrame,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof AdSlotFrame>

export const Placeholder: Story = {
  render: () => (
    <AdSlotFrame className="max-w-lg">
      <Skeleton variant="glass" className="h-24 w-full" />
    </AdSlotFrame>
  ),
}
