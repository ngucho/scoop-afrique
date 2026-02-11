import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'text', 'ghost', 'fillHover', 'danger', 'breaking'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'icon', 'icon-sm', 'icon-lg'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: { children: 'Button' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
}

export const Text: Story = {
  args: { variant: 'text', children: 'Text' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const FillHover: Story = {
  args: { variant: 'fillHover', children: 'Fill on hover' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Danger' },
}

export const Breaking: Story = {
  args: { variant: 'breaking', children: 'Breaking / CTA' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🔗</Button>
      <Button size="icon-sm">🔗</Button>
      <Button size="icon-lg">🔗</Button>
    </div>
  ),
}

export const Loading: Story = {
  args: { loading: true, children: 'Loading…' },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}
