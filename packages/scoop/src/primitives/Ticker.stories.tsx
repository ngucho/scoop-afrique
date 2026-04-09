import type { Meta, StoryObj } from '@storybook/react'
import { Ticker } from './Ticker'
import { Badge } from '../atoms/Badge'

const meta: Meta<typeof Ticker> = {
  title: 'Primitives/Ticker',
  component: Ticker,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta

type Story = StoryObj<typeof Ticker>

export const Default: Story = {
  render: () => (
    <Ticker>
      <span className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-foreground">
        Live
      </span>
      <Badge variant="muted">Afrique</Badge>
      <span className="text-sm text-muted-foreground">Nouvelles lignes — gardez les libellés courts</span>
    </Ticker>
  ),
}
