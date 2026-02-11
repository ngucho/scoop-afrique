import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Toggle } from './Toggle'
import { Label } from './Label'

const meta: Meta<typeof Toggle> = {
  title: 'Atoms/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Toggle>

export const Unchecked: Story = {
  args: { checked: false },
}

export const Checked: Story = {
  args: { checked: true },
}

export const Disabled: Story = {
  args: { disabled: true, checked: false },
}

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [on, setOn] = useState(false)
    return (
      <div className="flex items-center gap-3">
        <Toggle checked={on} onChange={setOn} />
        <Label>{on ? 'On' : 'Off'}</Label>
      </div>
    )
  },
}
