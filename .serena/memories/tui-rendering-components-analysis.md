# TUI Rendering Components Analysis

## Core Rendering Architecture
- **Main Library**: Uses `@opentui/solid` for TUI rendering
- **Entry Point**: `packages/opencode/src/cli/cmd/tui/app.tsx` - Main TUI application with render module loading
- **Native Detection**: `packages/opencode/src/util/native-render.ts` - Platform-specific render support detection

## Text & Markdown Rendering
- **Markdown Config**: `packages/opencode/src/config/markdown.ts` - Markdown parsing and configuration
- **Text Components**: 
  - `<text>` elements for basic text rendering
  - `<code filetype="markdown">` for markdown content with syntax highlighting
  - Located in `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx:854-870`

## Platform Support
- **Supported Platforms**: darwin, linux, win32
- **Supported Architectures**: x64, arm64
- **Error Handling**: `packages/opencode/src/cli/cmd/tui/component/native-render-error.tsx`

## Windows-Specific Concerns
The codebase includes platform detection and error handling for Windows environments, with specific focus on:
- Native library loading failures
- Permission issues
- Platform-specific package availability (@opentui/core-${platform}-${arch})

## Key Files for Windows Git Bash Rendering Issues
1. `packages/opencode/src/util/native-render.ts` - Platform detection and error handling
2. `packages/opencode/src/cli/cmd/tui/app.tsx` - Main render module loading
3. `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx` - Text and markdown rendering
4. `packages/opencode/src/config/markdown.ts` - Markdown processing