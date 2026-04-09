import nextConfig from 'eslint-config-next/core-web-vitals'
import nextTsConfig from 'eslint-config-next/typescript'

const config = [
  ...nextConfig,
  ...nextTsConfig,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
