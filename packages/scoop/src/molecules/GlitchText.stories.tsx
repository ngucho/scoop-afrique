import type { Meta, StoryObj } from '@storybook/react'
import { GlitchText } from './GlitchText'

const meta: Meta<typeof GlitchText> = {
  title: 'Molecules/GlitchText',
  component: GlitchText,
  tags: ['autodocs'],
  argTypes: {
    scramble: { control: 'boolean' },
    delay: { control: 'number' },
    as: { control: 'select', options: ['span', 'p', 'h1', 'h2', 'h3'] },
  },
}

export default meta

type Story = StoryObj<typeof GlitchText>

export const Default: Story = {
  args: {
    text: 'SCOOP.AFRIQUE',
    scramble: true,
  },
}

export const NoScramble: Story = {
  args: {
    text: 'SCOOP.AFRIQUE',
    scramble: false,
  },
}

export const AsHeading: Story = {
  args: {
    text: 'Le media digital',
    as: 'h2',
    className: 'text-2xl font-bold text-primary',
  },
}
