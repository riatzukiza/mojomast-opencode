# OpenCode Project Overview

## Purpose
OpenCode is an AI-powered development tool built for the terminal. It's a 100% open source alternative to Claude Code with a focus on TUI (Terminal User Interface) and LSP support. It features a client/server architecture allowing remote operation from various clients including mobile.

## Tech Stack
- **Runtime**: Bun 1.3+ 
- **Language**: TypeScript with SolidJS for TUI components
- **UI Framework**: SolidJS with @opentui/solid for terminal UI
- **Build System**: Turbo for monorepo management
- **Package Manager**: Bun with workspaces
- **Testing**: Bun test runner
- **Deployment**: SST (Serverless Stack) on Cloudflare

## Project Structure
- `packages/opencode/` - Core business logic & CLI entry point
- `packages/opencode/src/cli/cmd/tui/` - TUI code in SolidJS with opentui
- `packages/plugin/` - Plugin system source
- `packages/sdk/` - Multi-language SDKs (JS, Python, Go)
- `packages/console/` - Web console interface
- `packages/desktop/` - Desktop application
- `packages/web/` - Web interface
- `packages/function/` - Serverless functions
- `packages/identity/` - Branding assets
- `packages/slack/` - Slack integration
- `packages/script/` - Build and utility scripts

## Key Configuration
- TypeScript with `jsxImportSource: "@opentui/solid"`
- Monorepo with workspace dependencies
- Prettier config: semi=false, printWidth=100
- Husky for git hooks
- Turbo for task orchestration