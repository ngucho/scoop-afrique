import type { Meta, StoryObj } from '@storybook/react'
import { Blockquote, BlockquoteContent, BlockquoteFooter } from './Blockquote'

const meta: Meta<typeof Blockquote> = {
  title: 'Molecules/Blockquote',
  component: Blockquote,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Blockquote>

export const Default: Story = {
  render: () => (
    <Blockquote>
      <BlockquoteContent>
        Scoop Afrique, c&apos;est la voix d&apos;une génération qui refuse le silence.
      </BlockquoteContent>
      <BlockquoteFooter>— L&apos;équipe Scoop.Afrique</BlockquoteFooter>
    </Blockquote>
  ),
}
