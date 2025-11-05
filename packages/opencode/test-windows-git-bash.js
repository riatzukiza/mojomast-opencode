#!/usr/bin/env node

// Simple test to verify Windows Git Bash utilities work
const { detectTerminal, isGitBashEnvironment } = require('./src/util/terminal.ts');
const { normalizePathForDisplay, normalizePathForSystem } = require('./src/util/path.ts');
const { processAnsiForTerminal, sanitizeTextForTerminal } = require('./src/util/ansi.ts');

console.log('Testing Windows Git Bash utilities...');

// Test terminal detection
const terminal = detectTerminal();
console.log('Terminal detection:', {
  isGitBash: terminal.isGitBash,
  isWindows: terminal.isWindows,
  isMsys: terminal.isMsys,
  isCygwin: terminal.isCygwin
});

// Test path normalization
const windowsPath = 'C:\\Users\\test\\file.txt';
const normalizedPath = normalizePathForDisplay(windowsPath);
console.log('Path normalization test:', {
  original: windowsPath,
  normalized: normalizedPath
});

// Test ANSI processing
const testText = 'Some text with \x1b[31mcolor\x1b[0m and \x1b[1mbold\x1b[0m';
const sanitized = sanitizeTextForTerminal(testText);
const processed = processAnsiForTerminal(testText);
console.log('ANSI processing test:', {
  original: testText,
  sanitized: sanitized,
  processed: processed
});

console.log('Windows Git Bash utilities test completed!');