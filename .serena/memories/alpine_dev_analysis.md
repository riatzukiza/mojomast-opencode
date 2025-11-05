# Alpine Linux Local Development Analysis

## Current State Analysis

### Project Structure
- OpenCode is a monorepo with packages/ containing all components
- Current development assumes working within packages/ directory structure
- Uses Bun workspaces with catalog dependencies
- Build system creates platform-specific binaries with glibc dependencies

### Alpine Linux Compatibility Issues Identified

#### 1. **Binary Dependencies**
- **@parcel/watcher**: Currently uses `-glibc` suffix for Linux builds
- **ripgrep**: Uses `x86_64-unknown-linux-musl` for x64 Linux (good for Alpine)
- **Build process**: Hardcodes glibc-specific package names in build.ts

#### 2. **Current Limitations**
- Development workflow assumes packages/ directory structure
- No support for development outside packages/ 
- Binary dependencies not Alpine-compatible
- Installation script supports ash shell (Alpine default) but binaries aren't Alpine-compatible

#### 3. **"Outside packages/" Development Meaning**
Refers to enabling OpenCode development when:
- Source code is located outside the packages/ directory structure
- Developer wants to work on OpenCode as a standalone project
- Need to develop/test OpenCode without full monorepo setup

### Key Technical Challenges

1. **Musl vs Glibc**: Current dependencies target glibc, Alpine uses musl
2. **Workspace Dependencies**: Build assumes workspace package locations
3. **Binary Packaging**: Build process creates glibc-specific binaries
4. **Development Workflow**: Current setup requires monorepo structure

### Alpine-Specific Requirements
- Musl-compatible binary dependencies
- Support for ash shell in development scripts
- Standalone development environment setup
- Musl-compatible build targets