//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      '**/.nitro/**',
      '**/.tanstack/**',
      '**/.output/**',
      '**/.vinxi/**',
      './src/components/ui/*',
    ],
  },
]
