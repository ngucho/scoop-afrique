import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumb } from './Breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Molecules/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Breadcrumb>

const items = [
  { label: 'Accueil', href: '#' },
  { label: 'Actualités', href: '#' },
  { label: 'Article titre' },
]

export const Default: Story = {
  args: { items },
}

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Accueil', href: '#' },
      { label: 'Page actuelle' },
    ],
  },
}

export const LongPath: Story = {
  args: {
    items: [
      { label: 'Accueil', href: '#' },
      { label: 'Dossiers', href: '#' },
      { label: 'Économie', href: '#' },
      { label: 'Article long titre ici' },
    ],
  },
}
