#!/usr/bin/env bun

import { $ } from "bun"

// Restore original behavior: use the package script named "prettier".
// (If missing, this will fail as before.)
await $`bun run prettier --ignore-unknown --write`
