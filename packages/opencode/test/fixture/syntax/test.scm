; Scheme test file for syntax highlighting

(define (factorial n)
  (if (<= n 1)
      1
      (* n (factorial (- n 1)))))

(define-syntax when
  (syntax-rules ()
    ((when test body ...)
     (if test (begin body ...)))))

(define-class <point> ()
  (x :initarg :x :accessor point-x)
  (y :initarg :y :accessor point-y))

(let loop ((n 10) (acc 1))
  (if (zero? n)
      acc
      (loop (- n 1) (* acc n))))

(call/cc (lambda (k) (k 42)))

(define-record-type person
  (make-person name age)
  person?
  (name person-name)
  (age person-age set-person-age!))

'#(1 2 3 "vector" #\c #t #f)

(define (string-test)
  "This is a string
  with multiple lines"
  'symbol
  #:keyword
  |weird symbol|)
