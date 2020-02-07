const fs = require('fs');

for (const dirent of fs.readdirSync('packages/', { withFileTypes: true })) {
  fs.writeFileSync(`packages/${dirent.name}/package.json`, `{
  "name": "@damienmortini/${dirent.name}",
  "version": "0.0.1",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "author": "Damien Mortini",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "ssh://git@github.com/damienmortini/elements.git",
    "directory": "packages/${dirent.name}"
  }
}`);
  fs.writeFileSync(`packages/${dirent.name}/README.md`, `# \`<${dirent.name}>\`

## Installation

\`\`\`
npm config set @damienmortini:registry https://npm.pkg.github.com

npm install @damienmortini/${dirent.name}
\`\`\`

## Usage
\`\`\`
<script type="module">

  import MyElement from '@damienmortini/${dirent.name}';

  window.customElements.define(\`my-element-name\`, MyElement);

</script>

<my-element-name></my-element-name>
\`\`\`
`);
};
