import type { Meta, StoryObj } from '@storybook/react'
import { AfricanPattern } from './AfricanPattern'

const meta: Meta<typeof AfricanPattern> = {
  title: 'Patterns/AfricanPattern',
  component: AfricanPattern,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof AfricanPattern>

export const Default: Story = {
  args: {
    className: 'h-48 w-48 text-primary opacity-20',
  },
}

export const Large: Story = {
  args: {
    className: 'h-96 w-96 text-primary/30 scoop-float',
  },
}
