import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './Header'

const navItems = [
  { label: 'Actualités', href: '#' },
  { label: 'Vidéos', href: '#' },
  { label: 'Opinions', href: '#' },
  { label: 'Dossiers', href: '#' },
]

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof Header>

export const Default: Story = {
  args: {
    logoWordmark: 'Scoop',
    logoHref: '#',
    navItems: [],
  },
}

export const WithNav: Story = {
  args: {
    logoWordmark: 'Scoop',
    logoHref: '#',
    navItems,
  },
}

export const WithSearch: Story = {
  args: {
    logoWordmark: 'Scoop',
    logoHref: '#',
    navItems,
    showSearch: true,
    searchPlaceholder: 'Rechercher…',
  },
}

export const WithLiveAndCta: Story = {
  args: {
    logoWordmark: 'Scoop',
    logoHref: '#',
    navItems,
    showSearch: true,
    liveLabel: 'EN DIRECT',
    ctaLabel: 'Publier',
    ctaHref: '#',
  },
}
