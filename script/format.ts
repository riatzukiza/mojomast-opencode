#!/usr/bin/env bun

import { $ } from "bun"

// Use bunx to invoke the prettier binary from devDependencies.
// `bun run prettier` expects a package.json script named "prettier";
// this repo doesn't define that script, so call the binary directly.
await $`bunx prettier --ignore-unknown --write`
