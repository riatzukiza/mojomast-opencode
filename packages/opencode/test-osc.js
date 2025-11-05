// Test script to verify OSC stripping functionality
import { stripOSC } from "./src/util/osc.ts"

console.log("Testing OSC stripping functionality...\n")

// Test cases with various OSC sequences
const testCases = [
  {
    name: "Basic OSC sequence",
    input: "Hello\x1b]0;Terminal Title\x07World",
    expected: "HelloWorld"
  },
  {
    name: "OSC with ST terminator", 
    input: "Text\x1b]0;Title\x1b\\More text",
    expected: "TextMore text"
  },
  {
    name: "iTerm2 annotation (OSC 1337)",
    input: "Command\x1b]1337;File=name=test.txt;content=SGVsbG8gd29ybGQ=\x07Output",
    expected: "CommandOutput"
  },
  {
    name: "OSC 8 hyperlink",
    input: "Link to \x1b]8;url=https://example.com\x07example\x1b]8;;\x07 site",
    expected: "Link to example site"
  },
  {
    name: "OSC 52 clipboard",
    input: "Copy\x1b]52;c;SGVsbG8gd29ybGQ=\x07pasted",
    expected: "Copypasted"
  },
  {
    name: "Multiple OSC sequences",
    input: "\x1b]0;Title\x07\x1b]8;url=https://test.com\x07Link\x1b]1337;File=test\x07Text",
    expected: "LinkText"
  },
  {
    name: "Malformed OSC sequence",
    input: "Text\x1b]incomplete sequence",
    expected: "Text"
  },
  {
    name: "Mixed ANSI and OSC",
    input: "\x1b[31mRed\x1b]0;Title\x07Text\x1b[0m",
    expected: "\x1b[31mRedText\x1b[0m"
  }
]

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = stripOSC(testCase.input)
  const success = result === testCase.expected
  
  if (success) {
    passed++
    console.log(`✅ Test ${index + 1}: ${testCase.name}`)
    console.log(`   Input: ${JSON.stringify(testCase.input)}`)
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`)
    console.log(`   Got: ${JSON.stringify(result)}`)
  } else {
    failed++
    console.log(`❌ Test ${index + 1}: ${testCase.name}`)
    console.log(`   Input: ${JSON.stringify(testCase.input)}`)
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`)
    console.log(`   Got: ${JSON.stringify(result)}`)
  }
  console.log("")
})

console.log(`\nResults: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log("🎉 All tests passed!")
  process.exit(0)
} else {
  console.log("💥 Some tests failed!")
  process.exit(1)
}