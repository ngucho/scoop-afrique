import type { Meta, StoryObj } from '@storybook/react'
import { NavLinksList } from './NavLinksList'
import type { NavLinkItem } from './NavLinksList'

const meta: Meta<typeof NavLinksList> = {
  title: 'Molecules/NavLinksList',
  component: NavLinksList,
  tags: ['autodocs'],
}

export default meta

const links: NavLinkItem[] = [
  { label: 'A Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
  { label: 'Mentions légales', href: '/mentions-legales' },
]

const externalLinks: NavLinkItem[] = [
  { label: 'TikTok', href: 'https://tiktok.com/@Scoop.Afrique', external: true },
  { label: 'Instagram', href: 'https://instagram.com/Scoop.Afrique', external: true },
]

type Story = StoryObj<typeof NavLinksList>

export const Default: Story = {
  args: {
    title: 'Navigation',
    links,
  },
}

export const External: Story = {
  args: {
    title: 'Suivez-nous',
    links: externalLinks,
  },
}
