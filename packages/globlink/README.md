# Glob Link

`npm link` all packages matching an array of glob patterns

⚠️ To be able to link packages, they should be added to the list of linkable packages locally. See [npm link](https://docs.npmjs.com/cli/link) for more information.
If you are working in a monorepo with workspaces you can use `npm link --workspaces` to link all workspaces in one go.

## Command Line

```cmd
globlink @my-scope/* @my-scope2/* my-package
```

## API

```js
globLink(globPatterns:String[]) // Returns a promise
```

### Example

```js
import { globLink } from '@damienmortini/globlink'

await globLink([
  'my-package',
  '@my-scope/*'
  '@my-scope2/*'
])
```
