# Windows Git Bash Markdown Rendering Parity Analysis

## Current State
OpenCode is an AI coding agent built for the terminal with comprehensive TUI (Terminal User Interface) built using SolidJS and OpenTUI framework.

## Key Issues Identified

### 1. Rendering and Display Issues
- Screen artifacts and broken scrolling on Windows (Issue #3541)
- Large pasted content renders poorly, overflows and blends with questions (Issue #3007)
- "Weird artifacts" in all Windows terminals (Issue #2821)

### 2. Input and Interaction Issues
- Cannot paste multiple lines in Windows Terminal and VSCode+PowerShell (Issue #3343)
- Interactive calls (like `ssh -T git@github.com`) breaking the TUI on Windows (Issue #3763)

### 3. Platform-Specific Root Causes
- Inconsistent ANSI escape sequence support across Windows terminals
- Variable truecolor (24-bit) support
- Different paste behavior and multi-line input handling
- MSYS2/MinGW path translation between Unix and Windows paths
- SHELL environment variable detection complexities

## Rendering Architecture

### Core Components
- **TUI Framework**: `@opentui/solid` and `@opentui/core`
- **Session Display**: `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx`
- **Markdown Processing**: `packages/opencode/src/config/markdown.ts`
- **Syntax Highlighting**: Tree-sitter parsers with 20+ language support

### Text Rendering Flow
1. Markdown parsed with frontmatter support using `gray-matter`
2. Text parts rendered using `<code>` components with `filetype="markdown"`
3. Syntax highlighting applied via `syntaxStyle={syntax()}`
4. Platform-specific clipboard and path handling

## Existing Windows Support
- Platform detection for `MINGW*|CYGWIN*|MSYS*` environments
- Windows-specific input driver (`packages/tui/input/driver_windows.go`)
- Clipboard handling for Windows (`packages/opencode/src/cli/cmd/tui/util/clipboard.ts`)
- ANSI escape sequence processing with `Bun.stripANSI()`

## Areas Needing Attention for Git Bash Parity

### 1. Path Normalization
- File path display may not handle Git Bash style paths (`/c/` vs `C:\`)
- Need to normalize paths for consistent display across platforms

### 2. Shell Command Display
- Shell command rendering assumes Unix-style commands
- Need to handle Windows-specific command display in Git Bash context

### 3. ANSI Processing
- May need additional handling for Git Bash terminal emulation
- Ensure consistent color and formatting across different Windows terminals

### 4. Input Handling
- Multi-line paste behavior differs on Windows
- Interactive command handling needs Git Bash specific considerations

## Technical Implementation Details

### Markdown Processing
```typescript
// packages/opencode/src/config/markdown.ts
export const FILE_REGEX = /(?<![\w`])@(\.?[^\s`,.]*(?:\.[^\s`,.]+)*)/g
export const SHELL_REGEX = /!`([^`]+)`/g
```

### Text Rendering
```typescript
// packages/opencode/src/cli/cmd/tui/routes/session/index.tsx:860-866
<code
  filetype="markdown"
  drawUnstyledText={false}
  syntaxStyle={syntax()}
  content={props.part.text.trim()}
  conceal={ctx.conceal()}
/>
```

### Platform Detection
```typescript
// packages/opencode/src/cli/cmd/tui/util/clipboard.ts:15
const os = platform()
if (os === "win32") {
  // Windows-specific clipboard handling
}
```

## Next Steps
Focus on path normalization, shell command display formatting, and ANSI processing consistency for Windows Git Bash environment.