import { describe, expect, test } from "bun:test"
import { LANGUAGE_EXTENSIONS } from "../../src/lsp/language"

describe("Clojure Language Support", () => {
  test("should map Clojure file extensions to clojure language", () => {
    expect(LANGUAGE_EXTENSIONS[".clj"]).toBe("clojure")
    expect(LANGUAGE_EXTENSIONS[".cljs"]).toBe("clojure")
    expect(LANGUAGE_EXTENSIONS[".cljc"]).toBe("clojure")
    expect(LANGUAGE_EXTENSIONS[".edn"]).toBe("clojure")
  })

  test("should have consistent language mapping for all Clojure variants", () => {
    const clojureExtensions = [".clj", ".cljs", ".cljc", ".edn"]
    const languages = clojureExtensions.map(ext => LANGUAGE_EXTENSIONS[ext])
    
    // All should map to the same language
    expect(languages.every(lang => lang === "clojure")).toBe(true)
  })
})