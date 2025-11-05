# OpenCode Development Commands

## Core Development
```bash
# Install dependencies
bun install

# Start development server (main entry point)
bun dev

# Type checking across all packages
bun turbo typecheck

# Build all packages
bun turbo build

# Run tests
bun test
```

## Package-Specific Commands
```bash
# Test opencode package specifically
cd packages/opencode && bun test

# Typecheck opencode package
cd packages/opencode && bun run typecheck

# Build opencode package
cd packages/opencode && bun run build

# Run opencode CLI directly
cd packages/opencode && bun run --conditions=browser src/index.ts
```

## SDK Generation
```bash
# After touching server.ts, regenerate JS SDK
./packages/sdk/js/script/build.ts
```

## Git & Quality
```bash
# Git hooks are managed by Husky
# Pre-push hook will run automatically

# Manual formatting (if needed)
bun run format  # if available in package.json

# Check linting/type errors before commits
bun turbo typecheck
```

## Debugging
- Use `--print-logs` flag to see logs in stderr
- Set `--log-level DEBUG` for verbose output
- Log files stored at location shown in error messages
- Local development automatically sets DEBUG log level

## Testing the TUI
- Run `bun dev` from repo root or `packages/opencode`
- TUI uses SolidJS with opentui for terminal interface
- Test with various terminal environments for compatibility