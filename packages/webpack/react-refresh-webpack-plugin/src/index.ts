// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * @packageDocumentation
 *
 * A webpack plugin to integrate {@link https://github.com/preactjs/prefresh | prefresh} with ReactLynx.
 *
 * @remarks
 * Please use {@link ReactRefreshWebpackPlugin} for `'webpack'`.
 *
 * And use {@link ReactRefreshRspackPlugin} for `'rspack'`.
 */

export { ReactRefreshWebpackPlugin } from './ReactRefreshWebpackPlugin.js';
export type { ReactRefreshWebpackPluginOptions } from './ReactRefreshWebpackPlugin.js';

export { ReactRefreshRspackPlugin } from './ReactRefreshRspackPlugin.js';
export type { ReactRefreshRspackPluginOptions } from './ReactRefreshRspackPlugin.js';
