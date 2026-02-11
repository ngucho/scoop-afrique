import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Molecules/Tabs',
  component: Tabs,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: function TabsStory() {
    const [value, setValue] = useState('actualites')
    return (
      <Tabs value={value} onValueChange={setValue}>
        <TabsList>
          <TabsTrigger value="actualites">Actualités</TabsTrigger>
          <TabsTrigger value="videos">Vidéos</TabsTrigger>
          <TabsTrigger value="opinions">Opinions</TabsTrigger>
        </TabsList>
        <TabsContent value="actualites">
          <p className="text-sm text-muted-foreground">Contenu Actualités.</p>
        </TabsContent>
        <TabsContent value="videos">
          <p className="text-sm text-muted-foreground">Contenu Vidéos.</p>
        </TabsContent>
        <TabsContent value="opinions">
          <p className="text-sm text-muted-foreground">Contenu Opinions.</p>
        </TabsContent>
      </Tabs>
    )
  },
}
