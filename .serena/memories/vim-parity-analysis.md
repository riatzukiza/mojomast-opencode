# Vim Parity Analysis - Current State

## Components Analyzed

### 1. packages/ui/src/components/list.tsx
- Uses `solid-list` library for basic navigation
- Current: up/down arrows, Enter to select, loop navigation
- Missing: vim-style hjkl, word motions, jump motions

### 2. packages/ui/src/components/select-dialog.tsx  
- Uses `useFilteredList` hook with keyboard handling
- Current: basic up/down, Enter/Esc, Ctrl+P/N support
- Missing: comprehensive vim navigation

### 3. packages/opencode/src/cli/cmd/tui/ui/dialog-select.tsx
- Custom TUI implementation with useKeyboard hook
- Current: up/down, Ctrl+P/N, page up/down, Enter
- Missing: hjkl, word motions, vim-style jumps

### 4. packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx
- Autocomplete with basic up/down navigation
- Current: up/down, tab/enter to select, escape to cancel
- Missing: vim-style navigation patterns

## Current Navigation Support
- Basic up/down arrows (all components)
- Enter to select, Escape to cancel (most components)
- Limited vim support: Ctrl+P/N in some components
- Page up/down in dialog-select

## Missing Vim Features
- **hjkl movement**: Basic vim cursor movement
- **Word motions**: w, b, e, ge, W, B, E, gE
- **Jump motions**: gg, G, f{char}, t{char}, F{char}, T{char}
- **Count support**: 3j, 5k, 2w, etc.
- **Search**: /, ?, n, N
- **Text objects**: Not applicable for list navigation

## Implementation Strategy
Focus on enhancing the underlying navigation libraries and hooks used by these components rather than modifying each component individually.