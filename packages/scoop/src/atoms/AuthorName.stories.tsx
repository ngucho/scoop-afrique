import type { Meta, StoryObj } from '@storybook/react'
import { AuthorName } from './AuthorName'

const meta: Meta<typeof AuthorName> = {
  title: 'Atoms/AuthorName',
  component: AuthorName,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof AuthorName>

export const Default: Story = {
  args: { children: 'Marie Dupont' },
}

export const AsLink: Story = {
  args: {
    href: '#',
    children: 'Marie Dupont',
  },
}
