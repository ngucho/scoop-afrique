import type { Meta, StoryObj } from '@storybook/react'
import { SearchInput } from './SearchInput'

const meta: Meta<typeof SearchInput> = {
  title: 'Atoms/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof SearchInput>

export const Default: Story = {
  args: {
    placeholder: 'Rechercher…',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Scoop',
    placeholder: 'Rechercher…',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Rechercher…',
  },
}

export const FullWidth: Story = {
  args: {
    placeholder: 'Rechercher articles, vidéos…',
    className: 'w-full max-w-md',
  },
}
