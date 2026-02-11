import type { Meta, StoryObj } from '@storybook/react'
import { Logo } from './Logo'

const meta: Meta<typeof Logo> = {
  title: 'Atoms/Logo',
  component: Logo,
  tags: ['autodocs'],
  argTypes: {
    wordmark: { control: 'text' },
    href: { control: 'text' },
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
  },
}

export default meta

type Story = StoryObj<typeof Logo>

export const Wordmark: Story = {
  args: {
    wordmark: 'Scoop',
    href: '#',
  },
}

export const WordmarkSizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Logo wordmark="Scoop" href="#" size="sm" />
      <Logo wordmark="Scoop" href="#" size="default" />
      <Logo wordmark="Scoop" href="#" size="lg" />
    </div>
  ),
}

export const WithImage: Story = {
  args: {
    src: '/logo-scoopafrique.svg',
    href: '#',
  },
}

export const CustomChild: Story = {
  render: () => (
    <Logo href="#">
      <span className="font-[var(--font-scoop)] text-2xl font-bold">Scoop</span>
      <span className="text-primary">.Afrique</span>
    </Logo>
  ),
}
