; Normalize Common Lisp highlighting to better match Emacs-style forms:
; - neutral default call heads
; - explicit keyword coloring for def* and core forms

; Default Common Lisp call heads should be neutral (white), then specific
; form captures can override.
((list_lit
  .
  (sym_lit) @function.call.commonlisp.default))

; Lambda-list symbols should be neutral.
(defun_header
  lambda_list: (list_lit
    (sym_lit) @variable.parameter.commonlisp.default))

(defun_header
  lambda_list: (list_lit
    (list_lit
      .
      (sym_lit) @variable.parameter.commonlisp.default
      .
      (_))))

((sym_lit) @keyword.commonlisp.definition.call
  (#any-of? @keyword.commonlisp.definition.call
    "defun" "defmacro" "defmethod" "defgeneric" "defclass" "deftype"
    "defvar" "defparameter" "defconstant" "defstruct"
    "define-condition" "defpackage" "in-package" "eval-when"))

((sym_lit) @keyword.commonlisp.form.call
  (#any-of? @keyword.commonlisp.form.call
    "lambda" "let" "let*" "if" "when" "unless" "cond" "case" "ecase"
    "typecase" "ctypecase" "prog1" "prog2" "progn" "loop" "do" "do*"
    "multiple-value-bind" "multiple-value-call" "unwind-protect"
    "handler-case" "handler-bind" "restart-case" "with-open-file"
    "with-open-stream" "with-input-from-string" "with-output-to-string"
    "with-slots" "with-accessors" "flet" "labels" "macrolet" "declare"
    "check-type" "assert" "setf" "setq" "psetf" "psetq" "return"
    "return-from" "block" "tagbody" "go" "quote" "function"))

; Class/type names and definition names should use specific palettes.
((list_lit
  .
  (sym_lit) @_keyword.commonlisp.class
  (#eq? @_keyword.commonlisp.class "defclass")
  .
  (sym_lit) @type.commonlisp.class))

((list_lit
  .
  (sym_lit) @_keyword.commonlisp.deftype
  (#eq? @_keyword.commonlisp.deftype "deftype")
  .
  (sym_lit) @type.commonlisp.alias))

(defun_header
  keyword: (defun_keyword) @_keyword.commonlisp.definition_name
  function_name: (sym_lit) @function.commonlisp.definition
  (#any-of? @_keyword.commonlisp.definition_name
    "defun" "defmethod" "defgeneric" "defmacro"))

((list_lit
  .
  (sym_lit) @_keyword.commonlisp.condition
  (#eq? @_keyword.commonlisp.condition "define-condition")
  .
  (sym_lit) @function.commonlisp.definition))

; Keywords should render red by default, except package names in defpackage.
[
  (kwd_lit)
  (self_referential_reader_macro)
] @keyword.commonlisp.keyword

(kwd_lit
  ":" @keyword.commonlisp.keyword)

(((_)
  "#" @keyword.commonlisp.keyword
  (kwd_lit)))

((list_lit
  .
  (sym_lit) @_keyword.commonlisp.package
  (#eq? @_keyword.commonlisp.package "defpackage")
  .
  (kwd_lit) @module.commonlisp.package))

((list_lit
  .
  (sym_lit) @_keyword.commonlisp.package.colon
  (#eq? @_keyword.commonlisp.package.colon "defpackage")
  .
  (kwd_lit
    ":" @module.commonlisp.package)))

[
  (accumulation_verb)
  (for_clause_word)
  "for"
  "and"
  "finally"
  "thereis"
  "always"
  "when"
  "if"
  "unless"
  "else"
  "do"
  "loop"
  "below"
  "in"
  "from"
  "across"
  "repeat"
  "being"
  "into"
  "with"
  "as"
  "while"
  "until"
  "return"
  "initially"
] @keyword.commonlisp.form
