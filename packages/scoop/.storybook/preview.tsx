import type { Preview } from '@storybook/react'
import React from 'react'
import './preview.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: 'oklch(0.98 0 0)' },
        { name: 'dark', value: 'oklch(0.08 0 0)' },
      ],
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Scoop theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? 'light'
      return (
        <div className={theme === 'dark' ? 'dark' : ''}>
          <div className="min-h-[200px] bg-background p-6 text-foreground">
            <Story />
          </div>
        </div>
      )
    },
  ],
}

export default preview
