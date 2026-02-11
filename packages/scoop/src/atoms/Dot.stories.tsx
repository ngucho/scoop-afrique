import type { Meta, StoryObj } from '@storybook/react'
import { Dot } from './Dot'

const meta: Meta<typeof Dot> = {
  title: 'Atoms/Dot',
  component: Dot,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    pulse: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Dot>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Dot size="sm" />
      <Dot size="md" />
      <Dot size="lg" />
    </div>
  ),
}

export const Pulsing: Story = {
  args: { pulse: true, size: 'md' },
}
