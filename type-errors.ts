// File with TypeScript type errors

// Implicit any parameter
function add(a, b) {
  return a + b
}

// Wrong type assignment
let num: number = "hello"

// Missing return type
function multiply(x: number, y: number) {
  return x * y
}

// Type mismatch in function call
const result = add("5", 3)

// Undefined property access
interface User {
  name: string
  age: number
}

const user: User = { name: "John", age: 30 }
const email = user.email // Property doesn't exist

// Wrong array type
const numbers: number[] = ["1", "2", "3"]

// Optional chaining on non-nullable
const value = user?.address?.city

// Type assertion without proper checking
const data: any = { id: 1 }
const id = data.id as string

// Function with wrong return type
function getString(): string {
  return 42
}

// Generic type inference issue
function identity<T>(arg: T): T {
  return arg as any
}

// Union type without discrimination
type Status = "loading" | "success" | "error"
function handleStatus(status: Status) {
  if (status === "loading") {
    console.log("Loading...")
  } else if (status === "success") {
    console.log("Success!")
  }
  // Missing case for "error"
}
