# OpenCode Project Overview

OpenCode is an AI-powered development tool built for the terminal. It's a 100% open source alternative to Claude Code with a focus on TUI (Terminal User Interface) and LSP support.

## Core Architecture
- **Client/Server Architecture**: OpenCode runs on your computer while allowing remote control from various clients
- **TUI Focus**: Built by neovim users with emphasis on terminal-based development
- **Provider Agnostic**: Supports Anthropic, OpenAI, Google, and local models

## Tech Stack
- **Runtime**: Bun 1.3+
- **Language**: TypeScript with SolidJS for TUI components
- **Build System**: Turbo for monorepo management
- **UI Framework**: SolidJS with opentui for terminal interface
- **Package Manager**: Bun with workspaces
- **Testing**: Bun test runner
- **Linting**: Prettier with specific style guidelines

## Project Structure
- `packages/opencode/`: Core business logic & server
- `packages/opencode/src/cli/cmd/tui/`: TUI code in SolidJS
- `packages/plugin/`: Plugin system source
- `packages/desktop/`: Desktop client
- `packages/web/`: Web interface
- `packages/sdk/`: Multi-language SDKs (JS, Python, Go)
- `packages/console/`: Console application
- `packages/function/`: Serverless functions
- `packages/slack/`: Slack integration

## Key Features
- LSP support out of the box
- Multi-provider AI model support
- Terminal-based development environment
- Plugin system for extensibility
- Multiple client interfaces (TUI, Desktop, Web)