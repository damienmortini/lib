import { execSync } from 'child_process';
import fastGlob from 'fast-glob';
import fs from 'fs-extra';
import micromatch from 'micromatch';

/**
 * Function to npm link all packages matching an array of glob patterns
 * @param {String[]} globPatterns - Array of glob patterns to match
 */
export const globLink = async (globPatterns) => {
  const dependenciesToLink = new Set();

  for (const result of fastGlob.sync('**/package.json')) {
    let packageData;
    try {
      packageData = fs.readJSONSync(result);
    }
    catch (error) {
      continue;
    }
    for (const key of Object.keys({ ...packageData.dependencies, ...packageData.devDependencies })) {
      if (micromatch.isMatch(key, globPatterns)) dependenciesToLink.add(key);
    }
  }

  if (!dependenciesToLink.size) {
    console.log(`No dependencies found to link`);
    return;
  }

  console.log(`Found dependencies to link:`);
  console.log(dependenciesToLink);
  console.log(`Linking in progress...`);

  execSync(`npm link ${[...dependenciesToLink].join(' ')}`);
};
