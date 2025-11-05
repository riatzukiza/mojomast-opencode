# Windows Git Bash Rendering Root Causes

## Identified Issues

### 1. Terminal Detection & Compatibility
- **Background Detection**: Uses `\x1b]11;?\x07` ANSI sequence which may not work in Git Bash
- **Keyboard Handling**: `useKittyKeyboard: true` may not be compatible with Git Bash
- **Clipboard**: OSC52 sequences may have limited support in Git Bash

### 2. Process & Platform Handling
- **Process Spawning**: Uses `detached: process.platform !== "win32"` for bash tools
- **Process Killing**: Windows-specific `taskkill` commands for process termination
- **Binary Extensions**: Adds `.exe` extension for Windows binaries

### 3. Text Rendering Pipeline
- **ANSI Stripping**: Uses `Bun.stripANSI()` which may behave differently on Windows
- **Markdown Rendering**: Relies on `<code filetype="markdown">` with syntax highlighting
- **Native Library**: `@opentui/solid` loading may fail or behave differently on Git Bash

### 4. Missing Git Bash Detection
- No specific detection for Git Bash environment
- No platform-specific workarounds for Git Bash limitations
- Assumes Windows = CMD/PowerShell, not Git Bash

## Key Findings

1. **Existing Windows Support**: Basic Windows platform detection exists but assumes standard Windows terminals
2. **No Git Bash Specifics**: No special handling for Git Bash terminal limitations
3. **Native Dependencies**: Heavy reliance on native libraries that may not work properly in Git Bash
4. **ANSI Sequence Assumptions**: Assumes full ANSI support which may be limited in Git Bash

## Implementation Strategy

1. **Add Git Bash Detection**: Detect Git Bash environment specifically
2. **Terminal Capability Detection**: Test for ANSI support in Git Bash
3. **Fallback Rendering**: Implement simplified text rendering for Git Bash
4. **Platform-Specific Options**: Disable incompatible features in Git Bash
5. **Enhanced Error Handling**: Better error messages for Git Bash limitations