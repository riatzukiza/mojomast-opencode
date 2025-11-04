import { describe, expect, test } from "bun:test"
import parsers from "../../parsers-config"

describe("Clojure Parser Configuration", () => {
  test("should include Clojure parser in configuration", () => {
    const clojureParser = parsers.parsers.find(p => p.filetype === "clojure")
    expect(clojureParser).toBeDefined()
  })

  test("should have correct WASM URL for Clojure parser", () => {
    const clojureParser = parsers.parsers.find(p => p.filetype === "clojure")
    expect(clojureParser?.wasm).toBe("https://github.com/sogaiu/tree-sitter-clojure/releases/download/v0.0.13/tree-sitter-clojure.wasm")
  })

  test("should have highlights query for Clojure parser", () => {
    const clojureParser = parsers.parsers.find(p => p.filetype === "clojure")
    expect(clojureParser?.queries?.highlights).toBeDefined()
    expect(clojureParser?.queries?.highlights?.length).toBeGreaterThan(0)
    expect(clojureParser?.queries?.highlights?.[0]).toContain("highlights.scm")
  })
})