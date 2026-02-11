import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardContent, CardFooter } from './Card'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'news', 'video', 'breaking', 'feature', 'portrait'] },
  },
}

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-[320px]">
      <CardHeader>Card title</CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Card content. Le média digital qui décrypte l&apos;Afrique autrement.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const News: Story = {
  render: () => (
    <Card variant="news" className="w-[320px]">
      <CardHeader>Actualité</CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          News card variant. Hover for border accent.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Lire</Button>
      </CardFooter>
    </Card>
  ),
}

export const Video: Story = {
  render: () => (
    <Card variant="video" className="w-[320px]">
      <div className="aspect-video bg-muted" />
      <CardContent>
        <p className="text-sm text-muted-foreground">Video card with media area.</p>
      </CardContent>
    </Card>
  ),
}

export const Breaking: Story = {
  render: () => (
    <Card variant="breaking" className="w-[320px]">
      <CardHeader className="flex flex-row items-center gap-2">
        <Badge variant="breaking">Breaking</Badge>
        <span>Urgent</span>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Breaking card with signal color border.</p>
      </CardContent>
    </Card>
  ),
}

export const Feature: Story = {
  render: () => (
    <Card variant="feature" className="w-[320px]">
      <CardHeader>Feature</CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Feature card with primary tint.</p>
      </CardContent>
    </Card>
  ),
}

export const Simple: Story = {
  args: {
    className: 'w-[280px] p-6',
    children: 'Simple card with padding.',
  },
}
