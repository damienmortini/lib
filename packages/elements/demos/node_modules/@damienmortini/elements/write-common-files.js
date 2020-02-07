const fs = require('fs');

for (const dirent of fs.readdirSync('packages/', { withFileTypes: true })) {
  fs.writeFileSync(`packages/${dirent.name}/package.json`, `{
  "name": "@damienmortini/${dirent.name}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "author": "Damien Mortini",
  "license": "ISC"
}`);
  fs.writeFileSync(`packages/${dirent.name}/README.md`, `# \`<${dirent.name}>\`

## Installation

\`\`\`
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
