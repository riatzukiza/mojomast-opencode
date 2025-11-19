# Openhax Scope Publish Plan

## Context

- Goal: publish experimental fork under npm scope `@openhax/opencode` while keeping upstream-compatible codebase.
- Current package names: root workspace private `opencode`; CLI package `packages/opencode` (private) builds per-platform binaries and publishes `opencode-ai` from `script/publish.ts`.
- Dependencies remain on `@opencode-ai/*` workspaces; scope change is only for the distributable CLI wrapper.

## Relevant files

- packages/opencode/package.json (name/bin fields, publish visibility)
- packages/opencode/script/build.ts (binary artifact naming uses `pkg.name`)
- packages/opencode/script/publish.ts (packaging/publish pipeline derives names from `pkg.name`)
- packages/opencode/script/postinstall.mjs (postinstall looks for `opencode-<platform>-<arch>` packages)

## Requirements / Definition of Done

- CLI package can be published as `@openhax/opencode` without path issues from scoped names.
- Generated per-platform package names remain unscoped (`opencode-<platform>-<arch>` or a base name derived from `pkg.name`) so downstream installers still resolve binaries.
- Postinstall resolves the correct binary package name derived from the scoped base name.
- Publish script emits the scoped package name and tags correctly without hardcoded `opencode-ai`.
- Keep command/binary name stable (`opencode`) unless explicitly changed; document publish command for the new scope.
- Typecheck/build still succeed after changes (at least `bun run packages/opencode/script/build.ts --single` and repo `bun turbo typecheck`).

## Open Questions

- Keep the installed binary name `opencode` or add an alias (e.g., `openhax-opencode`) to avoid conflicts with upstream global installs?
- Should forks publish per-platform packages under the new scope as well, or keep unscoped binary packages for compatibility?

## Plan (phased)

1. Make CLI package publishable under the new scope: rename package to `@openhax/opencode`, drop `private`, and add `publishConfig` if needed.
2. Update build/publish scripts to derive filesystem-safe base names from scoped package names for dist folders, binaries, and npm metadata.
3. Ensure postinstall resolves binaries using the derived base name.
4. Run targeted checks (build single-platform, typecheck) and document publish steps for the fork scope.
