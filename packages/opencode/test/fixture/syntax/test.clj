;; Clojure test file for syntax highlighting

(ns my.app.core
  (:require [clojure.string :as str]
            [clojure.set :refer [union intersection]]
            [my.app.utils :refer-macros [defutil]])
  (:gen-class))

(def ^:dynamic *config* {:debug true :port 8080})

(defn factorial
  "Computes factorial of n"
  [n]
  (loop [n n acc 1]
    (if (<= n 1)
      acc
      (recur (dec n) (* acc n)))))

(defprotocol Drawable
  (draw [this canvas])
  (bounds [this]))

(defrecord Point [x y]
  Drawable
  (draw [this canvas]
    (str "Point at " x "," y))
  (bounds [this]
    {:x x :y y :width 0 :height 0}))

(deftype Counter [^:volatile-mutable count]
  clojure.lang.IDeref
  (deref [this] count))

(defmulti shape-area :type)

(defmethod shape-area :circle
  [{:keys [radius]}]
  (* Math/PI radius radius))

(defmethod shape-area :rectangle
  [{:keys [width height]}]
  (* width height))

(defn async-example []
  (let [ch (async/chan 10)]
    (async/go
      (async/>! ch :hello)
      (async/<! ch))
    ch))

(defmacro when-let*
  "Multiple binding when-let"
  [bindings & body]
  (let [pairs (partition 2 bindings)]
    `(if (and ~@(map first pairs))
       (let [~@bindings] ~@body))))

(defn regex-test []
  #"(?i)hello\s+world"
  #"\d{3}-\d{4}"
  #"multiline
  regex")

(defn tagged-literals []
  #inst "2024-01-15T10:30:00Z"
  #uuid "550e8400-e29b-41d4-a716-446655440000"
  #js {:a 1 :b 2})

(comment
  (factorial 10)
  (->> (range 10)
       (map inc)
       (filter even?)
       (reduce +)))

(set! *warn-on-reflection* true)
