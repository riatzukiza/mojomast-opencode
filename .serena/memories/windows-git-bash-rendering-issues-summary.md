# Windows Git Bash Markdown/Text Rendering Parity Issues - Summary

## Key Findings

### 1. Existing Bug Reports and Issues

#### Major Windows-Specific Issues:
- **#3763** - Interactive calls breaking TUI on Windows (ssh commands failing)
- **#3541** - Screen rendering bugs on Windows (scrolling issues, visual artifacts)
- **#3343** - Cannot paste multiple lines in Windows Terminal and VSCode+PowerShell
- **#2821** - Recommended Terminal for Windows - all terminals have "weird artifacts"
- **#631** - Windows Support super-issue (55 reactions, tracking all Windows problems)

#### Rendering-Specific Issues:
- **#3007** - Large pasted content renders poorly, overflows and blends with questions
- **#3541** - Screen bugging out with graphical artifacts, scrolling broken
- **#2843** - Text rendering/layout issues via SSH (closed, but indicates pattern)

### 2. Platform-Specific Code Patterns

#### Windows Platform Detection:
```go
// packages/opencode/bin/opencode
MINGW*|CYGWIN*|MSYS*) platform="win32" ;;
```

#### Windows-Specific File Handling:
- `.exe` extensions for binaries (fzf, rg, gopls, ruby-lsp)
- Platform-specific clipboard handling (`packages/tui/internal/clipboard/clipboard_windows.go`)
- Windows input driver (`packages/tui/input/driver_windows.go`)

#### Terminal Input Handling:
- Windows-specific key event parsing
- ANSI escape sequence handling differences
- Mouse event handling variations in Windows Terminal

### 3. Root Cause Analysis

#### A. Terminal Emulation Differences
1. **ANSI Sequence Support**: Windows terminals have inconsistent ANSI escape sequence support
2. **Truecolor Support**: Variable 24-bit color support across Windows terminals
3. **Input Handling**: Different paste behavior and multi-line input handling

#### B. Path Handling Issues
1. **Path Separators**: `/` vs `\` inconsistencies in Git Bash
2. **Executable Detection**: `.exe` extension handling
3. **Shell Environment**: SHELL variable detection on Windows

#### C. Rendering Engine Issues
1. **TUI Rendering**: OpenTUI rendering differences on Windows
2. **Markdown Rendering**: Glamour/ANSI rendering inconsistencies
3. **Scrolling**: Viewport and buffer management issues

### 4. Specific Git Bash Considerations

#### Environment Variables:
- `SHELL` environment variable may point to different bash implementations
- MSYS2/MinGW path translation issues
- Unix-style paths vs Windows paths

#### Terminal Characteristics:
- Git Bash emulates Unix environment on Windows
- Different terminal capabilities than native Windows Terminal
- Paste behavior differs from PowerShell/CMD

### 5. Existing Workarounds and Fixes

#### Applied Fixes:
- **PR #3103** - Fixed `rg` hanging in bash (stdin handling)
- **PR #2980** - Made file references & grep work on Windows
- **PR #2590** - Fixed TUI build with correct Windows file extension
- **PR #2558** - Windows npm cmd shim generation

#### In Progress:
- **PR #3712** - Respect SHELL environment variable on Windows for bash commands
- **PR #3494** - Use default shell for bash commands on Unix environments

### 6. Technical Implementation Details

#### Markdown Rendering Stack:
- Uses `glamour` for markdown rendering with ANSI styles
- `packages/tui/internal/styles/markdown.go` handles markdown styling
- Truecolor support detection in `packages/tui/internal/util/shimmer.go`

#### Input Handling:
- Windows-specific input driver with UTF-16 to UTF-8 conversion
- Escape sequence parsing differences
- Mouse event handling variations

#### Color/Theme Support:
- Adaptive color system for light/dark themes
- ANSI color fallbacks for limited terminal support
- Truecolor detection and fallback mechanisms

## Identified Gaps

### 1. Git Bash Specific Testing
- No specific test coverage for Git Bash environment
- Limited testing of MSYS2/MinGW path translation
- Paste behavior testing in Git Bash specifically

### 2. Rendering Parity Issues
- No systematic comparison of rendering between platforms
- Missing baseline for "correct" rendering behavior
- Limited automated testing for visual regressions

### 3. Terminal Compatibility Matrix
- No comprehensive testing across different Windows terminals
- Missing compatibility information for specific terminal versions
- No documented workarounds for specific terminal limitations

## Next Steps for Investigation

1. **Examine specific markdown rendering code** for Windows-specific handling
2. **Analyze input handling differences** in Git Bash vs other terminals
3. **Review clipboard and paste mechanisms** for Windows Git Bash
4. **Investigate scrolling and viewport management** in TUI on Windows
5. **Check ANSI escape sequence processing** for Windows-specific variations