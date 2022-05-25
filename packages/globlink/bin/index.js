#!/usr/bin/env node

import { globLink } from '../index.js'

await globLink(process.argv.splice(2))
