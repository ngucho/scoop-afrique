import type { Meta, StoryObj } from '@storybook/react'
import { Heading } from './Heading'

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    level: { control: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
    as: { control: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
  },
}

export default meta

type Story = StoryObj<typeof Heading>

export const H1: Story = {
  args: { as: 'h1', level: 'h1', children: 'Heading 1' },
}

export const H2: Story = {
  args: { as: 'h2', level: 'h2', children: 'Heading 2' },
}

export const H3: Story = {
  args: { as: 'h3', level: 'h3', children: 'Heading 3' },
}

export const H5: Story = {
  args: { as: 'h5', level: 'h5', children: 'Heading 5' },
}

export const H6: Story = {
  args: { as: 'h6', level: 'h6', children: 'Heading 6' },
}

export const WithPrimary: Story = {
  args: {
    as: 'h1',
    level: 'h1',
    accent: 'primary',
    children: 'Scoop .Afrique',
  },
}

export const WithSignal: Story = {
  args: {
    as: 'h2',
    level: 'h2',
    accent: 'signal',
    children: 'Breaking headline',
  },
}
