import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './Textarea'
import { Label } from './Label'

const meta: Meta<typeof Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: 'Écrivez votre commentaire…',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Contenu existant.\nDeuxième ligne.',
  },
}

export const Error: Story = {
  args: {
    placeholder: 'Champ invalide',
    error: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <Label htmlFor="ta-demo">Message</Label>
      <Textarea id="ta-demo" placeholder="Votre message…" rows={4} />
    </div>
  ),
}
