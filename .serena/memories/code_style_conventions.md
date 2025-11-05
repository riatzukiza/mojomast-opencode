# OpenCode Code Style & Conventions

## Core Principles (from AGENTS.md)
- Keep logic in single functions unless composable/reusable benefits are clear
- NO unnecessary variable destructuring
- AVOID `else` statements unless necessary
- AVOID `try`/`catch` when possible - prefer `.catch(...)`
- AVOID `any` types - use precise types
- AVOID `let` statements - prefer immutable patterns
- PREFER single-word variable names when descriptive
- Use Bun APIs like `Bun.file()` when applicable

## TypeScript Configuration
- JSX with `jsxImportSource: "@opentui/solid"`
- Strict type checking enabled
- Path aliases: `@/*` for `./src/*`, `@tui/*` for TUI components
- Custom conditions: `["browser"]`

## Code Organization
- Commands in `src/cli/cmd/` with dedicated files
- TUI components in `src/cli/cmd/tui/`
- Utilities in `src/util/`
- Server logic in `src/server/`
- LSP handling in `src/lsp/`

## Naming Conventions
- Files: kebab-case for most, PascalCase for components
- Functions: camelCase, preferably single-word when clear
- Variables: concise, single-word when possible
- Classes/Types: PascalCase

## Error Handling
- Use custom `NamedError` class for structured errors
- Prefer async error handling with `.catch()`
- Centralized error formatting in `cli/error.ts`
- Log all errors with structured data

## Import Patterns
- Use workspace imports for internal packages
- Prefer specific imports over namespace imports
- Group imports: external, then internal, then relative