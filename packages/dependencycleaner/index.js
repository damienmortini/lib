#!/usr/bin/env node

import depcheck from 'depcheck'
import { execSync } from 'child_process'

const results = await depcheck(process.cwd(), {})

console.log(`Running depclean on ${process.cwd()}`)

const unusedDependencies = results.dependencies
if (unusedDependencies.length) {
  console.log(`Removing unused dependencies: \n- ${unusedDependencies.join('\n- ')}`)
  execSync(`npm uninstall ${unusedDependencies.join(' ')}`)
}

const missingDependencies = [...Object.keys(results.missing)]
if (missingDependencies.length) {
  console.log(`Installing missing dependencies: \n- ${missingDependencies.join('\n- ')}`)
  execSync(`npm install ${missingDependencies.join(' ')}`)
}
