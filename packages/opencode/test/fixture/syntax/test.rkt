#lang racket

;; Racket test file for syntax highlighting

(require racket/class
         racket/gui/base
         racket/contract
         racket/match
         rackunit)

(provide (all-defined-out))
(provide (contract-out
          [factorial (-> natural? natural?)]
          [process-data (-> string? (values string? number?))]))

(define (factorial n)
  (if (<= n 1)
      1
      (* n (factorial (sub1 n)))))

(define/contract (safe-divide a b)
  (-> number? (and/c number? (not/c zero?)) number?)
  (/ a b))

(struct point (x y) #:transparent
  #:guard (lambda (x y name)
            (values (exact->inexact x)
                    (exact->inexact y)))
  #:methods gen:equal+hash
  [(define (equal-proc a b equal?-recur)
     (and (= (point-x a) (point-x b))
          (= (point-y a) (point-y b))))
   (define (hash-proc a hash-recur)
     (+ (* (point-x a) 31) (point-y a)))
   (define (hash2-proc a hash2-recur)
     (arithmetic-shift (point-x a) 16))])

(define point-class%
  (class object%
    (init-field [x 0] [y 0])
    (super-new)
    (define/public (distance-to other)
      (sqrt (+ (expt (- x (send other get-x)) 2)
               (expt (- y (send other get-y)) 2))))
    (define/public (get-x) x)
    (define/public (get-y) y)))

(define (match-example v)
  (match v
    [(list a b c) (list c b a)]
    [(list-rest head tail) (cons head tail)]
    [(hash-table ('name name) ('value val)) (list name val)]
    [(? string?) (string-length v)]
    [(? number? n) #:when (> n 0) 'positive]
    [_ 'unknown]))

(define-syntax-rule (when-let (var val) body ...)
  (let ([var val])
    (when var body ...)))

(define-syntax (define-logger stx)
  (syntax-case stx ()
    [(_ name)
     (with-syntax ([log-name (format-id #'name "log-~a" #'name)])
       #'(define (log-name msg)
           (printf "[~a] ~a~n" 'name msg)))]))

(module+ test
  (check-equal? (factorial 5) 120)
  (check-equal? (factorial 0) 1))

(module+ main
  (command-line
   #:args (filename)
   (displayln (format "Processing: ~a" filename))))

(define regex-test #rx"hello\\s+world")
(define pregexp-test #px"\\d{3}-\\d{4}")

(define (quasiquote-test)
  `(point x: ,x y: ,y total: ,(+ x y))
  `(list ,@(range 5)))
