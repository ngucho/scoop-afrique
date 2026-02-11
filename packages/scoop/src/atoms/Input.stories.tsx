import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'
import { Label } from './Label'

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number'] },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Placeholder',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Typed value',
  },
}

export const Error: Story = {
  args: {
    error: true,
    placeholder: 'Invalid input',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <Label htmlFor="input-demo">Email</Label>
      <Input id="input-demo" type="email" placeholder="you@example.com" />
    </div>
  ),
}
