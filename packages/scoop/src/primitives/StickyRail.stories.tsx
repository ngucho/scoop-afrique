import type { Meta, StoryObj } from '@storybook/react'
import { StickyRail } from './StickyRail'
import { Text } from '../atoms/Text'

const meta: Meta<typeof StickyRail> = {
  title: 'Primitives/StickyRail',
  component: StickyRail,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta

type Story = StoryObj<typeof StickyRail>

export const InScroll: Story = {
  render: () => (
    <div className="flex gap-6 p-8">
      <div className="h-[120vh] flex-1 rounded-xl bg-muted/40 p-4">
        <Text>Scroll the page — rail stays sticky.</Text>
      </div>
      <StickyRail className="w-64 shrink-0">
        <Text className="text-sm font-medium">Rail content</Text>
        <p className="mt-2 text-xs text-muted-foreground">Tools, TOC, or companion media.</p>
      </StickyRail>
    </div>
  ),
}
