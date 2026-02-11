import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './Label'

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
  },
}

export default meta

type Story = StoryObj<typeof Label>

export const Default: Story = {
  args: { children: 'Label' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label size="sm">Small label</Label>
      <Label size="default">Default label</Label>
      <Label size="lg">Large label</Label>
    </div>
  ),
}

export const ForInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <input id="email" type="email" className="h-10 border border-input px-3" placeholder="you@example.com" />
    </div>
  ),
}
