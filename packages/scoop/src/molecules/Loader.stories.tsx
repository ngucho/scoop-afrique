import type { Meta, StoryObj } from '@storybook/react'
import { Loader } from './Loader'

const meta: Meta<typeof Loader> = {
  title: 'Molecules/Loader',
  component: Loader,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
  },
}

export default meta

type Story = StoryObj<typeof Loader>

export const Default: Story = {} 

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Loader size="sm" />
      <Loader size="default" />
      <Loader size="lg" />
    </div>
  ),
}

export const Inline: Story = {
  render: () => (
    <p className="flex items-center gap-2 text-sm">
      <Loader size="sm" />
      Chargement…
    </p>
  ),
}
