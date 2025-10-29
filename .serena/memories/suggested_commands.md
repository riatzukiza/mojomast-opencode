# Suggested Commands for OpenCode Development

## Development
```bash
# Run the main opencode CLI
bun dev

# Type check all packages
bun turbo typecheck

# Run all tests
bun test

# Run tests for specific tool
bun test packages/opencode/test/tool/webfetch.test.ts
bun test packages/opencode/test/tool/bash.test.ts
bun test packages/opencode/test/tool/lsp-hover.test.ts

# Run tests with verbose output
bun test --verbose

# Run tests in watch mode
bun test --watch
```

## Code Quality
```bash
# Format code
bun run format  # if available, or use prettier directly
prettier --write .

# Type check specific package
bun --cwd packages/opencode typecheck

# Lint (if eslint is configured)
bun run lint
```

## Build & Release
```bash
# Build all packages
bun turbo build

# Prepare for release
bun prepare

# Build specific package
bun --cwd packages/opencode build
```

## Testing Individual Tools
```bash
# Test specific failing tools
bun test packages/opencode/test/tool/webfetch.test.ts
bun test packages/opencode/test/tool/bash.test.ts
bun test packages/opencode/test/tool/lsp-hover.test.ts
bun test packages/opencode/test/tool/write-diagnostics.test.ts
```