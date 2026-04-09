import type { Meta, StoryObj } from '@storybook/react'
import { GlassCard } from './GlassCard'
import { Text } from '../atoms/Text'

const meta: Meta<typeof GlassCard> = {
  title: 'Primitives/GlassCard',
  component: GlassCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          backgroundImage:
            'linear-gradient(135deg, oklch(0.7 0.15 280 / 0.35), oklch(0.85 0.08 145 / 0.4)), linear-gradient(180deg, oklch(0.95 0 0), oklch(0.88 0 0))',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof GlassCard>

export const Default: Story = {
  render: () => (
    <GlassCard className="max-w-md p-6">
      <Text className="text-[var(--on-glass-foreground)]">
        Glass surface over imagery or gradients. Copy uses on-glass tokens for contrast.
      </Text>
    </GlassCard>
  ),
}

export const RaisedInteractive: Story = {
  render: () => (
    <GlassCard elevation="raised" interactive className="max-w-md p-6">
      <Text>Hover for depth (disabled under reduced motion).</Text>
    </GlassCard>
  ),
}
