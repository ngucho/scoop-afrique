import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'breaking', 'muted'] },
  },
}

export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: { children: 'Badge' },
}

export const Breaking: Story = {
  args: { variant: 'breaking', children: 'Breaking' },
}

export const Muted: Story = {
  args: { variant: 'muted', children: 'Muted' },
}

export const WithDot: Story = {
  render: () => (
    <Badge>
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" />
      Live
    </Badge>
  ),
}
