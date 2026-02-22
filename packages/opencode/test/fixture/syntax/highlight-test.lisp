;;;; Common Lisp Syntax Highlighting Test File
;;; Comments should be light gray across all Lisp files.

(defpackage :my-test-package
  (:use :cl)
  (:export #:test-function)) ; :my-test-package should be light blue

(in-package :my-test-package)

;; Class name 'point' should be light blue
(defclass point ()
  ((x :initarg :x :accessor point-x) ; :initarg and :x should be red
   (y :initarg :y :accessor point-y))
  (:documentation "A simple 2D point")) ; :documentation should be red

;; Generic function name 'move' should be green
(defgeneric move (obj dx dy)
  (:documentation "Move an object by DX and DY"))

;; Method 'move' for class 'point'
(defmethod move ((p point) dx dy)
  (incf (point-x p) dx)
  (incf (point-y p) dy))

;; Type alias 'coordinate' should be teal
(deftype coordinate ()
  '(double-float 0.0d0))

;; Condition with :report keyword (should be red)
(define-condition simple-test-error (error)
  ((message :initarg :message :reader error-message))
  (:report (lambda (condition stream)
             (format stream "Test error: ~A" (error-message condition)))))

(defun test-syntax ()
  (let ((p (make-instance 'point :x 10.0 :y 20.0)))
    (move p 5 5)
    ;; Uninterned symbols should be red
    (list :regular-keyword #:uninterned-keyword)
    (print (point-x p))))

;; Loop keywords should be keyword colored
(loop for i from 1 to 10
      collect (* i i)
      finally (return "done"))
