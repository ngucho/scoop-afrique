import type { Meta, StoryObj } from '@storybook/react'
import { MetaBar } from './MetaBar'

const meta: Meta<typeof MetaBar> = {
  title: 'Molecules/MetaBar',
  component: MetaBar,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof MetaBar>

export const DateOnly: Story = {
  args: {
    dateTime: '2025-02-08T10:00:00Z',
  },
}

export const DateAndDuration: Story = {
  args: {
    dateTime: '2025-02-08T10:00:00Z',
    duration: '5 min',
  },
}

export const WithViews: Story = {
  args: {
    dateTime: '2025-02-08T10:00:00Z',
    viewCount: 12400,
  },
}

export const Full: Story = {
  args: {
    dateTime: '2025-02-08T10:00:00Z',
    duration: '3 min',
    viewCount: '12,4k',
    tags: ['Afrique', 'Économie', 'Politique'],
  },
}
