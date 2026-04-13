; Force definition forms to render with keyword palette.
; nvim's clojure query applies several overlapping captures; in OpenTUI,
; function/method captures can win for `def*` forms.

; Default Clojure call heads should be neutral (white), then specific
; macro/keyword captures can override.

((list_lit
  .
  (sym_lit name: (sym_name) @function.call.clojure.default)))

; Namespaced calls: color namespace separately from symbol.
((sym_lit
  namespace: (sym_ns) @module.clojure.namespace
  name: (sym_name) @function.call.clojure.default))

; Function argument symbols should be neutral.
((list_lit
  .
  (sym_lit
    name: (sym_name) @_keyword.clojure.definition.name)
  (#any-of? @_keyword.clojure.definition.name "defn" "defn-" "fn" "fn*")
  .
  (sym_lit)?
  .
  (vec_lit (sym_lit) @variable.parameter.clojure.default)))

((sym_lit) @keyword.clojure.definition.call
  (#any-of? @keyword.clojure.definition.call
    "def" "defonce" "defrecord" "defmacro" "definline" "definterface"
    "defmulti" "defmethod" "defstruct" "defprotocol" "deftype" "declare"))

((sym_lit
  name: (sym_name) @_keyword.clojure.definition.name) @keyword.clojure.definition.call
  (#any-of? @_keyword.clojure.definition.name "defn" "defn-" "fn" "fn*"))

((sym_lit) @keyword.clojure.form.call
  (#any-of? @keyword.clojure.form.call
    "let" "letfn" "if" "if-let" "if-not" "if-some" "when" "when-let" "when-not"
    "when-some" "cond" "cond->" "cond->>" "condp" "case" "doseq" "dotimes"
    "for" "loop" "recur" "while" "->" "->>" "some->" "some->>" "do" "try"
    "catch" "finally" "throw" "ns" "require" "import" "use"))
