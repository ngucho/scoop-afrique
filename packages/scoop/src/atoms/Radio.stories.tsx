import type { Meta, StoryObj } from '@storybook/react'
import { Radio } from './Radio'
import { Label } from './Label'

const meta: Meta<typeof Radio> = {
  title: 'Atoms/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Radio>

export const Default: Story = {
  args: { name: 'demo' },
}

export const Checked: Story = {
  args: { name: 'demo', checked: true },
}

export const Disabled: Story = {
  args: { name: 'demo', disabled: true },
}

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <Radio name="choice" value="a" />
        <span>Option A</span>
      </label>
      <label className="flex items-center gap-2">
        <Radio name="choice" value="b" defaultChecked />
        <span>Option B</span>
      </label>
      <label className="flex items-center gap-2">
        <Radio name="choice" value="c" />
        <span>Option C</span>
      </label>
    </div>
  ),
}
