# OpenCode Coding Conventions

## Core Principles
- Keep functions focused and single-purpose unless composable/reusable
- Avoid unnecessary variable destructuring
- Minimize control flow complexity

## Style Guidelines

### Functions
- **Single Function Logic**: Keep logic within one function unless breaking out adds clear reuse benefits
- **Concise Naming**: Use single-word variable names when descriptive
- **Bun APIs**: Prefer Bun helpers like `Bun.file()` when applicable

### Control Flow
- **No Else Statements**: Avoid `else` statements unless absolutely necessary
- **Error Handling**: Prefer `.catch()` over `try`/`catch` when possible
- **Early Returns**: Use early returns to reduce nesting

### Variables & Types
- **Immutable Patterns**: Avoid `let` statements, prefer `const`
- **No Any Types**: Use precise TypeScript types, avoid `any`
- **Minimal Destructuring**: Do not do unnecessary destructuring of variables

### Code Organization
- **Parallel Tool Usage**: Use parallel tool execution when applicable
- **Function Composition**: Break down complex operations into composable functions

## Configuration
- **Prettier**: Semi-colons disabled, print width 100
- **TypeScript**: Strict mode enabled with native preview features
- **Package Manager**: Bun with workspace catalog for dependencies

## File Structure Patterns
- **Index Files**: Use `index.ts` for clean exports
- **Type Definitions**: Co-locate types with implementations
- **Test Files**: Use `.test.ts` suffix alongside source files

## Import Patterns
- **Workspace Dependencies**: Use `workspace:*` for internal packages
- **Type Imports**: Use `import type` for type-only imports
- **Relative Imports**: Keep relative imports clean and minimal