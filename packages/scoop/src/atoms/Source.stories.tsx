import type { Meta, StoryObj } from '@storybook/react'
import { Source } from './Source'

const meta: Meta<typeof Source> = {
  title: 'Atoms/Source',
  component: Source,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof Source>

export const Default: Story = {
  args: { children: 'SCOOP AFRIQUE' },
}

export const AsLink: Story = {
  args: {
    href: '#',
    children: 'AFP',
  },
}
