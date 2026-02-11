import type { Meta, StoryObj } from '@storybook/react'
import { BackLink } from './BackLink'

const meta: Meta<typeof BackLink> = {
  title: 'Molecules/BackLink',
  component: BackLink,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
    children: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof BackLink>

export const Default: Story = {
  args: {
    href: '/',
    children: 'Retour à l\'accueil',
  },
}
