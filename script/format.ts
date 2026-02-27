#!/usr/bin/env bun

import { $ } from "bun"

// Restore original behavior: use the package script named "prettier".
// (If missing, this will fail as before.)
await $`bun run prettier --ignore-unknown --write`

if (process.env["CI"] && (await $`git status --porcelain`.text())) {
  await $`git config --local user.email "action@github.com"`
  await $`git config --local user.name "GitHub Action"`
  await $`git add -A`
  await $`git commit -m "chore: format code"`
  await $`git push --no-verify`
}
