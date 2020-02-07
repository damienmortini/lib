const fs = require('fs');

for (const dirent of fs.readdirSync('packages/', { withFileTypes: true })) {
  const packageData = JSON.parse(fs.readFileSync(`packages/${dirent.name}/package.json`, 'utf8'));
  const overridePackageData = {
    name: `@damienmortini/${dirent.name}`,
    description: `<${dirent.name}> custom element.`,
    main: 'index.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    keywords: [
      'custom elements',
      'web components',
    ],
    author: 'Damien Mortini',
    license: 'ISC',
    repository: {
      type: 'git',
      url: 'ssh://git@github.com/damienmortini/elements.git',
      directory: `packages/${dirent.name}`,
    },
    bugs: {
      url: 'https://github.com/damienmortini/elements/issues',
    },
    homepage: 'https://github.com/damienmortini/elements#readme',
  };

  fs.writeFileSync(`packages/${dirent.name}/package.json`, JSON.stringify({ ...packageData, ...overridePackageData }, null, '  '));

  fs.writeFileSync(`packages/${dirent.name}/README.md`, `# \`<${dirent.name}>\`

## Installation

\`\`\`sh
npm config set @damienmortini:registry https://npm.pkg.github.com

npm install @damienmortini/${dirent.name}
\`\`\`

## Usage
\`\`\`html
<script type="module">

  import MyElement from '@damienmortini/${dirent.name}';

  window.customElements.define(\`my-element-name\`, MyElement);

</script>

<my-element-name></my-element-name>
\`\`\`
`);
};
