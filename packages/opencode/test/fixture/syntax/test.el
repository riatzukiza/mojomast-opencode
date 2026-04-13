;;; Emacs Lisp test file for syntax highlighting

(require 'cl-lib)
(require 'seq)
(require 'subr-x)

;;;###autoload
(defun my-factorial (n)
  "Compute factorial of N.
Returns N! as an integer."
  (cl-check-type n (integer 0))
  (if (<= n 1)
      1
    (* n (my-factorial (1- n)))))

(defsubst my-square (x)
  "Return X squared."
  (* x x))

(defmacro my-with-temp-buffer (&rest body)
  "Execute BODY in a temporary buffer."
  (declare (indent 0) (debug t))
  `(with-temp-buffer
     ,@body))

(cl-defstruct (my-point (:constructor my-point-create)
                        (:copier my-point-copy))
  x y
  (z 0))

(defvar my-mode-map
  (let ((map (make-sparse-keymap)))
    (define-key map (kbd "C-c C-f") #'my-factorial)
    (define-key map [remap save-buffer] #'my-save)
    map)
  "Keymap for `my-mode'.")

(defcustom my-option nil
  "A customizable option."
  :group 'my-group
  :type '(choice (const :tag "None" nil)
                 (string :tag "String value")
                 (repeat integer)))

(define-minor-mode my-mode
  "Toggle my-mode."
  :init-value nil
  :lighter " My"
  :keymap my-mode-map
  :group 'my-group
  (if my-mode
      (my-mode-enable)
    (my-mode-disable)))

(defun my-syntax-test ()
  "Test various syntax elements."
  ;; Strings
  "Hello, World!"
  "Multiline\
  string"
  "Escapes: \"quotes\" \\ backslash"
  ;; Characters
  ?a ?A ?\n ?\t ?\C-m ?\M-x ?\C-\M-a
  ;; Numbers
  42 0xFF #b1010 #o755 1.5e10
  ;; Symbols
  'symbol 'keyword #:hash-colon
  ;; Lists and vectors
  '(1 2 3)
  [1 2 3]
  ;; Special characters in strings
  "Copyright \251 symbol"
  ;; Regex
  (string-match-p "\\`[a-z]+\\'" "test"))

(defun my-face-test ()
  "Test face definitions."
  (defface my-face
    '((t :inherit font-lock-keyword-face :foreground "blue"))
    "My custom face.")
  (propertize "text" 'face '(:foreground "red" :weight bold)))

(defun my-advice-test ()
  "Test advice."
  (advice-add #'my-factorial :before
              (lambda (n) (message "Computing %d!" n))))

(cl-defun my-cl-defun (&key name (count 1) &allow-other-keys)
  "CL-style defun with keyword arguments."
  (cl-loop repeat count
           do (message "Hello, %s!" name)))

(provide 'test)
;;; test.el ends here
