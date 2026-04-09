import type { Meta, StoryObj } from '@storybook/react'
import { AnnouncementBar } from './AnnouncementBar'
import { Link } from '../atoms/Link'

const meta: Meta<typeof AnnouncementBar> = {
  title: 'Primitives/AnnouncementBar',
  component: AnnouncementBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta

type Story = StoryObj<typeof AnnouncementBar>

export const Default: Story = {
  render: () => (
    <AnnouncementBar>
      <span>Nouveau numéro disponible.</span>
      <Link href="#">En savoir plus</Link>
    </AnnouncementBar>
  ),
}

export const Signal: Story = {
  render: () => (
    <AnnouncementBar variant="signal">
      <strong>Breaking:</strong> suivez le direct — contraste renforcé sur fond signal.
    </AnnouncementBar>
  ),
}
