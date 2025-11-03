# Test Clipboard Markdown Conversion

This is a test to verify that the clipboard functionality now properly preserves markdown structure.

## User Message Example

Here's some code:

```javascript
function hello() {
    console.log("Hello, world!");
}
```

And some inline code: `const x = 42;`

## Assistant Response Example

I'll help you with that code.

### Tool Output

**Shell** command="echo 'test'"

```console
$ echo 'test'
test
```

**Read** src/main.js

```javascript
function hello() {
    console.log("Hello, world!");
}
```

### Thinking

Let me analyze this code step by step...

## Expected Behavior

When copied to clipboard:
- Code blocks should preserve ```language syntax
- Inline code should keep `backticks`
- Tool outputs should be properly formatted
- Headers and formatting should be preserved