# OpenCode Project Overview

OpenCode is an AI-powered development tool built for the terminal. It's a 100% open source alternative to Claude Code with a focus on TUI (Terminal User Interface) and LSP support.

## Project Purpose
- AI coding agent built specifically for terminal environments
- Client/server architecture allowing remote driving from various clients
- Provider-agnostic (supports Anthropic, OpenAI, Google, local models)
- Built by neovim users with focus on terminal capabilities

## Tech Stack
- **Language**: TypeScript (Bun runtime)
- **Package Manager**: Bun 1.3.1
- **Monorepo**: Turborepo with workspaces
- **UI Framework**: SolidJS for TUI components
- **Build Tool**: Vite + esbuild
- **Testing**: Bun test runner
- **Linting/Formatting**: Prettier, TypeScript
- **Key Dependencies**:
  - @modelcontextprotocol/sdk (MCP support)
  - ai (AI SDK)
  - hono (web framework)
  - solid-js (UI framework)
  - tree-sitter (code parsing)

## Code Structure
- `packages/opencode/` - Main CLI application
- `packages/console/` - Web console interface
- `packages/desktop/` - Desktop app
- `packages/web/` - Web interface
- `packages/sdk/` - Multi-language SDKs (JS, Python, Go)
- `packages/plugin/` - Plugin system
- `packages/slack/` - Slack integration

## Key Commands
- `bun dev` - Run opencode in development mode (from packages/opencode)
- `bun turbo typecheck` - Type checking across all packages
- `bun test` - Run tests (from packages/opencode)
- `bun run build` - Build the project

## Development Workflow
- Uses Husky for git hooks
- Turbo for monorepo task orchestration
- Workspace dependencies managed via Bun
- Patched dependencies for specific fixes