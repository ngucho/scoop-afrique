import type { Meta, StoryObj } from '@storybook/react'
import { Thumbnail } from './Thumbnail'

const placeholderImage = 'https://placehold.co/640x360/1a1a1a/fff?text=Video'

const meta: Meta<typeof Thumbnail> = {
  title: 'Atoms/Thumbnail',
  component: Thumbnail,
  tags: ['autodocs'],
  argTypes: {
    aspectRatio: { control: 'select', options: ['video', 'square', 'portrait', 'auto'] },
  },
}

export default meta

type Story = StoryObj<typeof Thumbnail>

export const Video: Story = {
  args: {
    src: placeholderImage,
    alt: 'Video thumbnail',
    aspectRatio: 'video',
  },
}

export const Square: Story = {
  args: {
    src: placeholderImage,
    alt: 'Square',
    aspectRatio: 'square',
  },
}

export const Portrait: Story = {
  args: {
    src: placeholderImage,
    alt: 'Portrait',
    aspectRatio: 'portrait',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Thumbnail src={placeholderImage} alt="Small" aspectRatio="video" className="w-40" />
      <Thumbnail src={placeholderImage} alt="Medium" aspectRatio="video" className="w-64" />
      <Thumbnail src={placeholderImage} alt="Large" aspectRatio="video" className="w-80" />
    </div>
  ),
}
