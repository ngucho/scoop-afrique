import type { Meta, StoryObj } from '@storybook/react'
import { AuthorBlock } from './AuthorBlock'

const meta: Meta<typeof AuthorBlock> = {
  title: 'Molecules/AuthorBlock',
  component: AuthorBlock,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    href: { control: 'text' },
    role: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof AuthorBlock>

export const Default: Story = {
  args: {
    name: 'Marie Dupont',
  },
}

export const WithRole: Story = {
  args: {
    name: 'Marie Dupont',
    role: 'Rédactrice en chef',
  },
}

export const WithLink: Story = {
  args: {
    name: 'Marie Dupont',
    href: '#',
    role: 'Journaliste',
  },
}

export const WithAvatar: Story = {
  args: {
    name: 'Jean Okala',
    avatarSrc: 'https://placehold.co/80/1a1a1a/fff?text=JO',
    role: 'Correspondant',
  },
}
