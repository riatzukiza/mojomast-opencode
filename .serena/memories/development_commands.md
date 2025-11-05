# Essential Development Commands

## Setup & Installation
```bash
# Install dependencies
bun install

# Start development server (from repo root)
bun dev

# Start opencode development (from packages/opencode)
cd packages/opencode && bun dev
```

## Build & Type Checking
```bash
# Type check all packages
bun turbo typecheck

# Build all packages
bun turbo build

# Type check specific package
cd packages/opencode && bun run typecheck

# Build specific package
cd packages/opencode && bun run build
```

## Testing
```bash
# Run tests for opencode package
cd packages/opencode && bun test

# Run tests with turbo (if configured)
bun turbo test
```

## Code Quality
```bash
# Format code (Prettier configured)
bun run format  # if available

# Git hooks (husky configured)
bun prepare
```

## SDK Generation
```bash
# After touching packages/opencode/src/server/server.ts
./packages/sdk/js/script/build.ts
```

## Package Management
```bash
# Add dependency to workspace
bun add <package> --workspace

# Add dev dependency
bun add <package> --dev

# Install all dependencies
bun install
```

## Environment Setup
- Requires Bun 1.3+
- Uses XDG Base Directory specification for config
- Supports environment-specific configurations