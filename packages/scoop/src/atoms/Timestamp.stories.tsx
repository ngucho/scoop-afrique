import type { Meta, StoryObj } from '@storybook/react'
import { Timestamp } from './Timestamp'

const meta: Meta<typeof Timestamp> = {
  title: 'Atoms/Timestamp',
  component: Timestamp,
  tags: ['autodocs'],
  argTypes: {
    dateTime: { control: 'text' },
    format: { control: 'select', options: ['relative', 'date', 'datetime'] },
  },
}

export default meta

type Story = StoryObj<typeof Timestamp>

export const Default: Story = {
  args: {
    dateTime: '2025-02-08T12:00:00Z',
    children: '8 fév. 2025',
  },
}

export const DateTimeOnly: Story = {
  args: {
    dateTime: '2025-02-08T14:30:00',
  },
}

export const CustomFormat: Story = {
  args: {
    dateTime: '2025-02-08',
    children: '8 février 2025',
  },
}
