// Test JSX compilation
import { render } from "@opentui/solid"

function TestComponent() {
  return <box>Hello World</box>
}

export function test() {
  return render(TestComponent)
}
