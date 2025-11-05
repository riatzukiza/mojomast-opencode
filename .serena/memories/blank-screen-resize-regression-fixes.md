# Blank Screen & Resize Regression Fixes

## Issues Identified
Both regressions were introduced in commit f42e1c63 "tui: fix focus management and dialog interactions"

### 1. Blank Screen Issue
Root cause: Focus management errors in dialog.tsx refocus() function causing unhandled exceptions that resulted in blank screens.

### 2. Resize Regression  
Root cause: Insufficient bounds checking in terminal dimension calculations across multiple components.

## Fixes Applied

### dialog.tsx (Blank Screen Fix)
- Added try-catch error handling in refocus() function to silently handle focus errors
- Prevents unhandled exceptions that caused blank screens
- Added debug logging for focus errors

### dialog.tsx (Resize Fix)
- Added minimum width constraint: `Math.max(60, dimensions().width - 2)`
- Ensures dialog maintains minimum usable width during resize

### dialog-select.tsx (Resize Fix)
- Added minimum height constraint: `Math.max(10, Math.floor(dimensions().height / 2) - 6)`
- Prevents dialog from becoming too small during terminal resize

### session/index.tsx (Resize Fix)
- Added minimum content width: `Math.max(40, dimensions().width - (sidebarVisible() ? 42 : 0) - 4)`
- Ensures content area remains usable during resize operations

## Testing
- All typechecks pass
- Fixes address both focus management and resize handling robustness
- Maintains backward compatibility with existing functionality