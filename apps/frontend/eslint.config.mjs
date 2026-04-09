import nextConfig from 'eslint-config-next'
import nextTypeScriptConfig from 'eslint-config-next/typescript'

const config = [
  ...nextConfig,
  ...nextTypeScriptConfig,
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
