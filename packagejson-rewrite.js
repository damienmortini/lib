import fs from 'fs';
import fastGlob from 'fast-glob';

const fileResults = fastGlob.sync([
  '*/package.json',
  'element/*/package.json',
], {
  cwd: 'packages',
  objectMode: true,
});

for (const result of fileResults) {
  const filePath = `packages/${result.path}`;
  const directory = filePath.replace(`/${result.name}`, '');
  const packageData = {
    ...JSON.parse(fs.readFileSync(filePath)),
    author: 'Damien Mortini',
    publishConfig: {
      access: 'public',
    },
    license: 'ISC',
    repository: {
      type: 'git',
      url: 'https://github.com/damienmortini/lib',
      directory,
    },
    bugs: 'https://github.com/damienmortini/lib/issues',
    homepage: `https://github.com/damienmortini/lib/${directory}`,
  };
  fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2));
}
