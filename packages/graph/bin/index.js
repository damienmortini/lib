#!/usr/bin/env node

import Server from '../Server.js';

for (const arg of process.argv) {
  if (arg === 'server') {
    new Server();
  }
}
