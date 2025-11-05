# Windows Git Bash Rendering Analysis

## Current Investigation Summary

Based on the codebase examination, I've identified the key components involved in text/markdown rendering that could be causing parity issues on Windows Git Bash:

### Key Rendering Components:
1. **Main TUI App**: `packages/opencode/src/cli/cmd/tui/app.tsx` - Handles native library detection and fallback
2. **Text Rendering**: `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx` - Contains `TextPart` component that renders markdown using `<code filetype="markdown">`
3. **Native Render Detection**: `packages/opencode/src/util/native-render.ts` - Platform-specific detection and error handling
4. **Markdown Config**: `packages/opencode/src/config/markdown.ts` - Basic markdown parsing configuration

### Potential Windows Git Bash Issues:

#### 1. Native Library Loading
- The app uses `@opentui/solid` for TUI rendering with fallback error handling
- Platform detection supports win32 but may have issues specific to Git Bash environment
- Native render detection includes checks for preload, platform packages, and basic functionality

#### 2. Text/Markdown Rendering
- Markdown is rendered using `<code filetype="markdown">` with syntax highlighting
- Uses `Bun.stripANSI()` for shell output processing
- Text rendering relies on terminal capabilities that may differ on Windows Git Bash

#### 3. Terminal Compatibility
- Terminal background detection uses ANSI escape sequences (`\x1b]11;?\x07`)
- Keyboard handling uses `useKittyKeyboard: true` which may not work on Git Bash
- Clipboard functionality uses OSC52 sequences which may have limited support

### Next Steps Needed:
1. Identify specific rendering differences between platforms
2. Test Windows Git Bash terminal capabilities
3. Implement platform-specific workarounds for text rendering
4. Add better error handling and fallbacks for Windows Git Bash

## Root Cause Hypothesis:
The issue likely stems from differences in terminal capabilities and ANSI escape sequence handling between Windows Git Bash and other terminals, particularly around:
- ANSI color and formatting support
- Unicode/emoji rendering
- Terminal size detection
- Native library loading in Git Bash environment