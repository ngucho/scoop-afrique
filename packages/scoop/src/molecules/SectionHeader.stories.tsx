import type { Meta, StoryObj } from '@storybook/react'
import { SectionHeader } from './SectionHeader'

const meta: Meta<typeof SectionHeader> = {
  title: 'Molecules/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  argTypes: {
    number: { control: 'text' },
    label: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof SectionHeader>

export const Default: Story = {
  args: {
    number: '001',
    label: 'SECTION',
  },
}

export const Manifeste: Story = {
  args: {
    number: '001',
    label: 'MANIFESTE',
    className: 'mb-8',
  },
}
