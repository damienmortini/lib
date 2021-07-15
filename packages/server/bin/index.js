#!/usr/bin/env node

import Server from '../Server.js'

/**
 * Extract parameters
 */
let verbose = false
let path = ''
let watchPath = '.'

for (const arg of process.argv) {
  if (arg.startsWith('--path')) {
    path = arg.split('=')[1].trim()
  } else if (arg.startsWith('--watchpath')) {
    watchPath = arg.split('=')[1].trim()
  } else if (arg === '--verbose') {
    verbose = true
  }
}

new Server({
  path,
  watchPath,
  verbose,
})
