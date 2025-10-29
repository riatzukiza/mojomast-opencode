# OpenCode Project Overview

OpenCode is an AI coding agent built for the terminal. It's a 100% open source alternative to Claude Code with a focus on TUI and LSP support.

## Tech Stack
- **Language**: TypeScript
- **Runtime**: Bun
- **Package Manager**: Bun 1.3.0
- **Testing**: Bun's built-in test runner
- **Build**: Turbo for monorepo builds
- **Linting**: Prettier (semi: false, printWidth: 120)
- **Architecture**: Client/server with TUI frontend

## Project Structure
- `packages/opencode/` - Main CLI tool
- `packages/console/` - Web console interface
- `packages/desktop/` - Desktop app
- `packages/sdk/` - SDK for multiple languages (JS, Go)
- `packages/ui/` - UI components
- `packages/web/` - Web interface
- `packages/tui/` - Terminal UI (Go)
- `packages/plugin/` - Plugin system
- `packages/slack/` - Slack integration
- `packages/function/` - Serverless functions

## Key Commands
- `bun dev` - Run development server
- `bun turbo typecheck` - Type check all packages
- `bun test` - Run tests (from package root)
- `bun prepare` - Setup git hooks

## Code Style
- No semicolons
- 120 character line width
- Minimal variable destructuring
- Avoid `else` statements when possible
- Avoid `try/catch` when possible
- Prefer single word variable names
- Use Bun APIs where possible
- Keep functions composable and reusable

## Testing
Tests are located in `packages/opencode/test/` and use Bun's test framework with vi for mocking.