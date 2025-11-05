# Readline/Vim Parity Implementation Analysis

## Current State
- **TUI List**: Uses solid-list with basic up/down/Enter navigation
- **TUI Select Dialog**: Uses useFilteredList with limited vim support (Ctrl+P/N)
- **Dialog Select**: Custom keyboard handling but missing core vim motions
- **Autocomplete**: Basic up/down navigation only

## Identified Parity Gaps
1. **Missing hjkl navigation** - Core vim movement
2. **Missing word motions** - w, b, e, E, ge, gE, etc.
3. **Missing text objects** - diw, daw, ciw, etc.
4. **Missing jump motions** - gg, G, f{char}, t{char}, etc.
5. **Missing vim-style search** - /, n, N
6. **Inconsistent keybinding patterns** across components

## Implementation Plan
1. Enhance solid-list with vim navigation
2. Update TUI components for consistent vim behavior
3. Update Opencode dialog components
4. Add comprehensive keybinding configuration
5. Test and validate all navigation patterns

## Key Vim Features to Implement
- **Movement**: h, j, k, l (with count support)
- **Word motions**: w, b, e, E, ge, gE
- **Jumps**: gg, G, f{char}, F{char}, t{char}, T{char}
- **Search**: /, n, N
- **Text objects**: diw, daw, ciw (future scope)
- **Marks**: m{mark}, '{', '{', etc.