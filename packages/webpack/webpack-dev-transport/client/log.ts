// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
const PREFIX = '[rspeedy-dev-server]';

const log: {
  error(...args: string[]): void;
  warn(...args: string[]): void;
  info(...args: string[]): void;
  log(...args: string[]): void;
  debug(...args: string[]): void;
} = {
  error: console.error.bind(console, PREFIX),
  warn: console.warn.bind(console, PREFIX),
  info: console.info.bind(console, PREFIX),
  log: console.log.bind(console, PREFIX),
  debug: console.debug.bind(console, PREFIX),
};

const logEnabledFeatures = (features: Record<string, boolean>): void => {
  if (!features || Object.keys(features).length === 0) {
    return;
  }

  let logString = 'Server started:';

  // Server started: Hot Module Replacement enabled, Live Reloading enabled, Overlay disabled.
  for (const [key, enable] of Object.entries(features)) {
    logString += ` ${key} ${enable ? 'enabled' : 'disabled'},`;
  }
  // replace last comma with a period
  logString = logString.slice(0, -1).concat('.');

  log.info(logString);
};

export { logEnabledFeatures, log };
