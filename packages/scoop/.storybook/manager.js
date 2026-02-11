import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming'

/** Scoop Design System — use the media logo in the sidebar */
const theme = create({
  base: 'light',
  brandTitle: 'Scoop Design System',
  brandUrl: 'https://www.scoop-afrique.com',
  brandImage: '/logo-scoopafrique.svg',
  brandTarget: '_blank',
})

addons.setConfig({
  theme,
})
