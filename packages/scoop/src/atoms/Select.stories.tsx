import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'
import { Label } from './Label'

const options = [
  { value: 'news', label: 'Actualités' },
  { value: 'video', label: 'Vidéos' },
  { value: 'opinion', label: 'Opinions' },
  { value: 'dossier', label: 'Dossiers', disabled: true },
]

const meta: Meta<typeof Select> = {
  title: 'Atoms/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Select>

export const Default: Story = {
  args: {
    options,
    placeholder: 'Choisir une catégorie',
  },
}

export const WithValue: Story = {
  args: {
    options,
    defaultValue: 'video',
  },
}

export const Error: Story = {
  args: {
    options,
    placeholder: 'Choisir',
    error: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="select-demo">Catégorie</Label>
      <Select id="select-demo" options={options} placeholder="Sélectionner" />
    </div>
  ),
}
