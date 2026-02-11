import type { Meta, StoryObj } from '@storybook/react'
import { Footer } from './Footer'

const links = [
  { label: 'À propos', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Équipe', href: '#' },
]

const legalLinks = [
  { label: 'Mentions légales', href: '#' },
  { label: 'Politique de confidentialité', href: '#' },
]

const socialLinks = [
  { label: 'Twitter', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'Facebook', href: '#' },
]

const meta: Meta<typeof Footer> = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof Footer>

export const Minimal: Story = {
  args: {
    logoWordmark: 'Scoop',
    logoHref: '#',
    copyright: '© 2025 Scoop Afrique. Tous droits réservés.',
  },
}

export const WithLinks: Story = {
  args: {
    logoWordmark: 'Scoop',
    logoHref: '#',
    links,
    legalLinks,
    copyright: '© 2025 Scoop Afrique.',
  },
}

export const Full: Story = {
  args: {
    logoWordmark: 'Scoop',
    logoHref: '#',
    links,
    legalLinks,
    socialLinks,
    newsletterTitle: 'Newsletter',
    newsletterCta: 'Restez informé. Inscrivez-vous.',
    copyright: '© 2025 Scoop Afrique. Tous droits réservés.',
  },
}
