import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { CategoryChips } from './CategoryChips'

const items = [
  { id: 'all', label: 'Tout' },
  { id: 'news', label: 'Actualités' },
  { id: 'video', label: 'Vidéos' },
  { id: 'opinion', label: 'Opinions' },
  { id: 'dossier', label: 'Dossiers' },
]

const meta: Meta<typeof CategoryChips> = {
  title: 'Molecules/CategoryChips',
  component: CategoryChips,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof CategoryChips>

export const Default: Story = {
  args: { items },
}

export const WithActive: Story = {
  args: { items, activeId: 'video' },
}

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [active, setActive] = useState('all')
    return (
      <CategoryChips
        items={items}
        activeId={active}
        onSelect={setActive}
      />
    )
  },
}

export const AsLinks: Story = {
  args: {
    items: items.map((i) => ({ ...i, href: `#${i.id}` })),
  },
}
