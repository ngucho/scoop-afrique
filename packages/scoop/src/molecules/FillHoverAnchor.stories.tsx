import type { Meta, StoryObj } from '@storybook/react'
import { FillHoverAnchor } from './FillHoverAnchor'

const meta: Meta<typeof FillHoverAnchor> = {
  title: 'Molecules/FillHoverAnchor',
  component: FillHoverAnchor,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
  },
}

export default meta

type Story = StoryObj<typeof FillHoverAnchor>

export const Default: Story = {
  args: {
    href: '#',
    children: 'Découvrir',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <FillHoverAnchor href="#" size="sm">Small</FillHoverAnchor>
      <FillHoverAnchor href="#" size="default">Default</FillHoverAnchor>
      <FillHoverAnchor href="#" size="lg">Large</FillHoverAnchor>
    </div>
  ),
}
