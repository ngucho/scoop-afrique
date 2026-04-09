import type { Meta, StoryObj } from '@storybook/react'
import { MotionEnter } from './MotionEnter'
import { SubtleParallax } from './SubtleParallax'
import { GlassCard } from './GlassCard'
import { Text } from '../atoms/Text'

const meta: Meta = {
  title: 'Primitives/Motion',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj

export const Enter: Story = {
  render: () => (
    <MotionEnter>
      <GlassCard className="max-w-sm p-6">
        <Text>Mounts with fade-up (respects reduced motion).</Text>
      </GlassCard>
    </MotionEnter>
  ),
}

export const Parallax: Story = {
  render: () => (
    <SubtleParallax className="inline-block rounded-xl border border-dashed border-border p-8">
      <Text>Move the pointer — subtle shift (off when reduced motion).</Text>
    </SubtleParallax>
  ),
}
