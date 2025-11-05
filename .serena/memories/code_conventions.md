# OpenCode Code Conventions

## Style Guidelines
- **Keep functions simple**: Try to keep things in one function unless composable or reusable
- **Avoid unnecessary destructuring**: DO NOT do unnecessary destructuring of variables
- **Control flow**: 
  - DO NOT use `else` statements unless necessary
  - DO NOT use `try`/`catch` if it can be avoided
  - AVOID `try`/`catch` where possible
  - AVOID `else` statements
- **Type safety**: AVOID using `any` type
- **Variable declarations**: AVOID `let` statements, prefer const
- **Naming**: PREFER single word variable names where possible
- **API usage**: Use as many Bun APIs as possible like Bun.file()

## Tool Usage Patterns
- **Parallel execution**: ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE
- Example pattern for multiple file reads using multi_tool_use.parallel

## TypeScript Configuration
- Extends @tsconfig/bun/tsconfig.json
- Strict type checking enabled
- Modern TypeScript features with @typescript/native-preview

## Formatting
- Prettier configuration: semi: false, printWidth: 100
- Consistent code style across the project

## Testing
- Bun test runner
- Test files co-located with source files
- Snapshot testing for tool outputs

## Error Handling
- Prefer structured error handling over try/catch
- Use proper error types and messages
- Log errors appropriately for debugging