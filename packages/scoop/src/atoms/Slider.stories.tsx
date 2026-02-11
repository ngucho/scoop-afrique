import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from './Slider'
import { Label } from './Label'

const meta: Meta<typeof Slider> = {
  title: 'Atoms/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Slider>

export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
    'aria-label': 'Volume',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label>Volume</Label>
      <Slider min={0} max={100} defaultValue={70} aria-label="Volume" />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 30,
    disabled: true,
    'aria-label': 'Volume',
  },
}
