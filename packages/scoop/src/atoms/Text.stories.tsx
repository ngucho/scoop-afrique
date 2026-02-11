import type { Meta, StoryObj } from '@storybook/react'
import { Text } from './Text'

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['body', 'muted', 'small', 'mono', 'lead', 'caption', 'overline', 'label', 'quote'],
    },
    truncate: { control: 'select', options: ['none', '1', '2', '3'] },
  },
}

export default meta

type Story = StoryObj<typeof Text>

export const Default: Story = {
  args: {
    children: 'Default body text. Le média digital qui décrypte l\'Afrique autrement.',
  },
}

export const Lead: Story = {
  args: { variant: 'lead', children: 'Lead paragraph with larger size.' },
}

export const Muted: Story = {
  args: { variant: 'muted', children: 'Muted secondary text.' },
}

export const Small: Story = {
  args: { variant: 'small', children: 'Small caption or label.' },
}

export const Caption: Story = {
  args: { variant: 'caption', children: 'Caption style.' },
}

export const Overline: Story = {
  args: { variant: 'overline', children: 'Overline' },
}

export const Label: Story = {
  args: { variant: 'label', children: 'Label' },
}

export const Quote: Story = {
  args: { variant: 'quote', children: 'Quote style with Scoop font.' },
}

export const Mono: Story = {
  args: { variant: 'mono', children: 'MONO UPPERCASE' },
}

export const Truncate1: Story = {
  args: {
    variant: 'body',
    truncate: '1',
    children: 'This long line will be truncated to one line with an ellipsis at the end when it overflows.',
  },
}

export const Truncate2: Story = {
  args: {
    variant: 'body',
    truncate: '2',
    children: 'This long paragraph will be truncated to two lines. Le média digital qui décrypte l\'Afrique autrement.',
  },
}
