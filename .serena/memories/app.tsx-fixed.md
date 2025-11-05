Fixed version of app.tsx with proper native library detection and graceful failure handling.

Key improvements:
1. Proper import structure with useTerminalDimensions imported
2. Single detectNativeLibrarySupport function definition
3. Clean showNativeLibraryError function with helpful error messages
4. Proper integration in tui() function
5. No duplicate code or render options
6. Proper error handling throughout

The implementation now:
- Detects native library loading failures early
- Shows helpful error messages with system information
- Provides actionable solutions for users
- Gracefully exits without crashing
- Maintains all existing functionality when native libs load successfully