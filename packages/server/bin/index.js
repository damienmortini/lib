#!/usr/bin/env node

import { spawn } from 'child_process';

const serverBinPath = process.argv[1].replace('index.js', 'server-bin.js');

spawn('node', ['--preserve-symlinks', '--preserve-symlinks-main', serverBinPath, ...process.argv.slice(2)], { stdio: 'inherit' });
