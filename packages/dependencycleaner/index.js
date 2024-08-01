#!/usr/bin/env node

import { execSync } from 'child_process';
import depcheck from 'depcheck';

let preventInstall = false;

for (const arg of process.argv) {
  if (arg === '--no-install') {
    preventInstall = true;
  }
}

const results = await depcheck(process.cwd(), {});

console.log(`Running depclean on ${process.cwd()}`);

const unusedDependencies = results.dependencies;
if (unusedDependencies.length) {
  if (preventInstall) {
    console.log(`Unused dependencies: \n- ${unusedDependencies.join('\n- ')}`);
  }
  else {
    console.log(`Removing unused dependencies: \n- ${unusedDependencies.join('\n- ')}`);
    execSync(`npm uninstall ${unusedDependencies.join(' ')}`);
  }
}

const missingDependencies = [...Object.keys(results.missing)];
if (missingDependencies.length) {
  if (preventInstall) {
    console.log(`Missing dependencies: \n- ${missingDependencies.join('\n- ')}`);
  }
  else {
    console.log(`Installing missing dependencies: \n- ${missingDependencies.join('\n- ')}`);
    execSync(`npm install ${missingDependencies.join(' ')}`);
  }
}
