// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { URL } from 'node:url'

import { createRsbuild } from '@rsbuild/core'
import { describe, expect, test, vi } from 'vitest'

import { LAYERS } from '@lynx-js/react-webpack-plugin'

vi.mock('node:module', async (importOriginal) => {
  const original = await importOriginal()
  const { createRequire: originalCreateRequire } =
    original as typeof import('node:module')
  return {
    ...original as object,
    createRequire: vi.fn().mockImplementation((path: string | URL) => {
      const originalRequire = originalCreateRequire(path)
      const mockedRequire = (id: string) => {
        if (/[\\/](?:packages[\\/])?react[\\/]*package\.json$/.test(id)) {
          return { version: '0.112.0' }
        } else {
          // eslint-disable-next-line
          return originalRequire(id)
        }
      }
      mockedRequire.resolve = originalRequire.resolve
      return mockedRequire
    }),
  }
})

describe('@lynx-js/react/compat - alias', () => {
  test('alias with @lynx-js/react >= 0.112.0', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { pluginReactAlias } = await import('../../src/index.js')

    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginReactAlias({
            LAYERS,
          }),
        ],
      },
    })
    const [config] = await rsbuild.initConfigs()
    expect(config?.resolve?.alias ?? {}).toHaveProperty(
      '@lynx-js/react/compat$',
    )
  })
})
