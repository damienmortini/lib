#!/usr/bin/env node

import Server from '../Server.js'

/**
 * Extract parameters
 */
let verbose = false
let resolveModules = false
let path
let watchPath
let watchIgnore

for (const arg of process.argv) {
  if (arg.startsWith('--path')) {
    path = arg.split('=')[1].trim()
  } else if (arg.startsWith('--watchpath')) {
    watchPath = arg.split('=')[1].trim()
  } else if (arg.startsWith('--watchignore')) {
    watchIgnore = arg.split('=')[1].trim()
  } else if (arg === '--verbose') {
    verbose = true
  } else if (arg === '--resolve-modules') {
    resolveModules = true
  }
}

new Server({
  path,
  watch: true,
  watchPath,
  watchIgnore,
  verbose,
  resolveModules,
})
