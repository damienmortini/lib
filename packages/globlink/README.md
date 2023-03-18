# Glob Link

`npm link` all packages matching an array of glob patterns

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
