import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import micromatch from 'micromatch'
import { execSync } from 'child_process'

/**
 * Function to npm batch link packages from glob patterns
 * @param {String[]} globPatterns - Array of glob patterns to match
 */
export const globLink = async (globPatterns) => {
  const dependenciesToLink = new Set()

  for (const result of fastGlob.sync('**/package.json')) {
    let packageData
    try {
      packageData = fs.readJSONSync(result)
    } catch (error) {
      continue
    }
    for (const key of Object.keys({ ...packageData.dependencies, ...packageData.devDependencies })) {
      if (micromatch.isMatch(key, globPatterns)) dependenciesToLink.add(key)
    }
  }

  execSync(`npm link ${[...dependenciesToLink].join(' ')}`)
}

