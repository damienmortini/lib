import fastGlob from 'fast-glob';
import fs from 'fs';
import sortPackageJson from 'sort-package-json';

// Re-write package.json
for (const result of fastGlob.sync(['**/package.json'], {
  cwd: 'packages',
  ignore: ['**/node_modules'],
  objectMode: true,
})) {
  const filePath = `packages/${result.path}`;
  const directory = filePath.replace(`/${result.name}`, '');
  const packageData = sortPackageJson({
    ...{
      main: 'index.js',
    },
    ...JSON.parse(fs.readFileSync(filePath, 'utf-8')),
    author: 'Damien Mortini',
    type: 'module',
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
    homepage: `https://github.com/damienmortini/lib/tree/main/${directory}`,
  });

  fs.writeFileSync(filePath, `${JSON.stringify(packageData, null, 2)}\n`);

  // const npmPackageJsonLint = new NpmPackageJsonLint({
  //   packageJsonFilePath: filePath,
  //   packageJsonObject: packageData,
  //   fix: true,
  //   config: {
  //     extends: 'npm-package-json-lint-config-default',
  //   },
  // });
  // const lintResult = npmPackageJsonLint.lint();

  // fs.writeFileSync(filePath, `${JSON.stringify(packageData, null, 2)}\n`);

  // console.log(lintResult);
  // npmPackageJsonLint.packageJsonObject = packageData;
}

// Re-write elements README
for (const result of fastGlob.sync(['*/README.md'], {
  cwd: 'packages/element',
  objectMode: true,
})) {
  const elementName = `${result.path.replace(`/${result.name}`, '')}`;
  const filePath = `packages/element/${result.path}`;
  fs.writeFileSync(
    filePath,
    `# \`<damo-${elementName}>\`

## Installation

\`\`\`sh
npm install @damienmortini/element-${elementName}
\`\`\`

## Simple Usage
\`\`\`html
<script src="node_modules/@damienmortini/element-${elementName}/index.js"></script>

<damo-${elementName}></damo-${elementName}>
\`\`\`

## Usage with custom name
\`\`\`html
<script type="module">

  import Element from '@damienmortini/element-${elementName}';

  window.customElements.define('my-element-name', class extends Element { });

</script>

<my-element-name></my-element-name>
\`\`\``,
  );
}
