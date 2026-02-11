import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
    alt: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof Avatar>

export const Fallback: Story = {
  args: {
    alt: 'John Doe',
  },
}

export const WithInitials: Story = {
  args: {
    alt: 'Marie Dupont',
  },
}

export const WithImage: Story = {
  args: {
    src: 'https://placehold.co/100/1a1a1a/fff?text=MD',
    alt: 'Marie Dupont',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar alt="Small" size="sm" />
      <Avatar alt="Default" size="default" />
      <Avatar alt="Large" size="lg" />
    </div>
  ),
}
