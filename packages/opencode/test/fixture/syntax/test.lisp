;;;; Common Lisp test file for syntax highlighting

(defpackage :my-app
  (:use :cl :alexandria)
  (:export #:main #:process-data))

(in-package :my-app)

(defun factorial (n)
  "Compute factorial of N"
  (check-type n (integer 0 *))
  (loop for i from 1 to n
        for acc = 1 then (* acc i)
        finally (return acc)))

(defclass entity ()
  ((id :initarg :id :reader entity-id :type (or string null))
   (name :initarg :name :accessor entity-name :initform "")
   (created-at :initform (get-universal-time) :reader entity-created))
  (:documentation "Base entity class"))

(defmethod print-object ((obj entity) stream)
  (print-unreadable-object (obj stream :type t :identity t)
    (format stream "~A" (entity-id obj))))

(defgeneric process (entity input)
  (:documentation "Process input for entity"))

(defmacro with-open-files (bindings &body body)
  (let ((gensyms (loop repeat (length bindings) collect (gensym))))
    `(let ,(mapcar #'list gensyms bindings)
       (unwind-protect
            (multiple-value-call #'(lambda (&rest args) (declare (ignore args)) ,@body)
              ,@(mapcar #'list gensyms bindings))
         ,@(mapcar (lambda (g) `(close ,g :abort t)) gensyms)))))

(define-condition process-error (error)
  ((message :initarg :message :reader error-message)
   (code :initarg :code :reader error-code))
  (:report (lambda (condition stream)
             (format stream "Process error [~A]: ~A"
                     (error-code condition)
                     (error-message condition)))))

(deftype natural-number ()
  `(integer 0 *))

(defun syntax-test ()
  ;; Numbers
  42 0xFF #b1010 #o755 3.14159 6.022e23
  ;; Characters
  #\a #\Space #\Newline #\Rubout
  ;; Strings
  "Hello, World!"
  "Multiline
  string"
  ;; Symbols
  |Symbol with spaces| keyword: #:uninterned
  ;; Arrays
  #(1 2 3 4 5)
  #2A((1 2) (3 4))
  ;; Pathnames
  #p"/home/user/file.txt")

(eval-when (:compile-toplevel :load-toplevel :execute)
  (defvar *compile-time-info* "Available at compile time"))

(setq *print-case* :capitalize)
