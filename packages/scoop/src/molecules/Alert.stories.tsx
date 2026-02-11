import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'Molecules/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'error', 'success', 'warning'] },
  },
}

export default meta

type Story = StoryObj<typeof Alert>

export const Default: Story = {
  args: {
    children: 'Information message. Le média digital qui décrypte l\'Afrique autrement.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Une erreur s\'est produite. Veuillez réessayer.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Votre inscription a bien été enregistrée.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Cette action est irréversible.',
  },
}
