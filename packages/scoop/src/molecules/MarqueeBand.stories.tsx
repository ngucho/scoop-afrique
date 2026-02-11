import type { Meta, StoryObj } from '@storybook/react'
import { MarqueeBand } from './MarqueeBand'

const meta: Meta<typeof MarqueeBand> = {
  title: 'Molecules/MarqueeBand',
  component: MarqueeBand,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['left', 'right'] },
    speed: { control: 'number' },
  },
}

export default meta

type Story = StoryObj<typeof MarqueeBand>

export const Default: Story = {
  args: {
    text: 'INFORMER — ANALYSER — INSPIRER — CONNECTER',
    direction: 'left',
    speed: 25,
  },
}

export const Right: Story = {
  args: {
    text: 'SCOOP.AFRIQUE — Le media digital',
    direction: 'right',
    speed: 30,
  },
}
