import type { Meta, StoryObj } from '@storybook/react'
import { CursorTracker } from './CursorTracker'

const meta: Meta<typeof CursorTracker> = {
  title: 'Organisms/CursorTracker',
  component: CursorTracker,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof CursorTracker>

export const Default: Story = {
  render: () => (
    <div className="relative h-[400px] w-full cursor-none border border-border bg-card">
      <CursorTracker />
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Curseur simple (anneau + point) — bougez la souris
      </div>
    </div>
  ),
}
