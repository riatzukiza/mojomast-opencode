# OpenCode Project Overview

OpenCode is an AI-powered development tool built for the terminal with a focus on TUI (Terminal User Interface). It's 100% open source and provider-agnostic.

## Tech Stack
- **Language**: TypeScript
- **Runtime**: Bun
- **Package Manager**: Bun 1.3.1
- **Architecture**: Monorepo with workspaces
- **UI Framework**: SolidJS with TUI components
- **Testing**: Bun test framework
- **Build**: Turbo for monorepo builds

## Project Structure
- `packages/opencode/` - Main OpenCode package
- `packages/console/` - Console application
- `packages/desktop/` - Desktop application  
- `packages/web/` - Web interface
- `packages/sdk/` - SDK for multiple languages (JS, Python, Go)
- `packages/ui/` - Shared UI components
- `packages/slack/` - Slack integration
- `packages/plugin/` - Plugin system

## Code Style & Conventions
- No unnecessary destructuring
- Avoid `else` statements unless necessary
- Avoid `try`/`catch` where possible
- Avoid `any` types
- Avoid `let` statements (prefer const)
- Prefer single word variable names
- Use Bun APIs where possible (e.g., Bun.file())
- Keep things in one function unless composable or reusable

## Key Commands
- `bun dev` - Test opencode in packages/opencode directory
- `bun turbo typecheck` - Run type checking
- `bun test` - Run tests

## Current Leader Key Implementation
The project already has a basic leader key implementation in `packages/opencode/src/cli/cmd/tui/context/keybind.tsx`:
- Simple boolean state for leader mode
- 2-second timeout
- Basic `<leader>` syntax support in keybind parsing
- Configurable leader key via `keybinds.leader` (default: "ctrl+x")

## Key Files for Leader State Machine
- `packages/opencode/src/util/keybind.ts` - Keybind parsing and matching utilities
- `packages/opencode/src/cli/cmd/tui/context/keybind.tsx` - Current leader key implementation
- `packages/opencode/src/config/config.ts` - Keybind configuration schema
- `packages/opencode/test/keybind.test.ts` - Keybind tests