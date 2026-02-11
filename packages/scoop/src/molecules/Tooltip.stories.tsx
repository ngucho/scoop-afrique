import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip } from './Tooltip'
import { Button } from '../atoms/Button'

const meta: Meta<typeof Tooltip> = {
  title: 'Molecules/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
  },
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  args: {
    content: 'Tooltip text',
    children: <button type="button" className="border border-border px-3 py-2 text-sm">Hover me</button>,
  },
}

export const OnButton: Story = {
  args: {
    content: 'Action description',
    children: <Button size="sm">Save</Button>,
  },
}

export const Sides: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 p-16">
      <Tooltip content="Top" side="top">
        <span className="cursor-default border border-border px-3 py-2 text-sm">Top</span>
      </Tooltip>
      <Tooltip content="Right" side="right">
        <span className="cursor-default border border-border px-3 py-2 text-sm">Right</span>
      </Tooltip>
      <Tooltip content="Bottom" side="bottom">
        <span className="cursor-default border border-border px-3 py-2 text-sm">Bottom</span>
      </Tooltip>
      <Tooltip content="Left" side="left">
        <span className="cursor-default border border-border px-3 py-2 text-sm">Left</span>
      </Tooltip>
    </div>
  ),
}
