// File with various linting errors

var unused_var = "this variable is never used"

function badFunction(param1, param2, extra_param) {
  var x = 1
  var y = 2

  if (x == 1) {
    console.log("use === instead of ==")
  }

  var result = param1 + param2
  console.log(result)

  return
}

function anotherFunction() {
  var a = 1,
    b = 2,
    c = 3
  console.log(a, b, c)
}

// Missing semicolons
var obj = {
  name: "test",
  value: 123,
}

// Trailing whitespace
var spaced = "hello"

// Unused function
function unusedFunction() {
  return "never called"
}

// Mixed quotes
var single = "single quotes"
var double = "double quotes"

// Undefined variable
console.log(undefined_variable)
