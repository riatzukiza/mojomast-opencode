import fuzzysort from "fuzzysort"
import { entries, flatMap, groupBy, map, pipe } from "remeda"
import { createMemo, createResource } from "solid-js"
import { createStore } from "solid-js/store"
import { createList } from "solid-list"

export interface FilteredListProps<T> {
  items: T[] | ((filter: string) => Promise<T[]>)
  key: (item: T) => string
  filterKeys?: string[]
  current?: T
  groupBy?: (x: T) => string
  sortBy?: (a: T, b: T) => number
  sortGroupsBy?: (
    a: { category: string; items: T[] },
    b: { category: string; items: T[] },
  ) => number
  onSelect?: (value: T | undefined) => void
}

export function useFilteredList<T>(props: FilteredListProps<T>) {
  const [store, setStore] = createStore<{ filter: string }>({ filter: "" })

  const [grouped, { refetch }] = createResource(
    () => store.filter,
    async (filter) => {
      const needle = filter?.toLowerCase()
      const all =
        (typeof props.items === "function" ? await props.items(needle) : props.items) || []
      const result = pipe(
        all,
        (x) => {
          if (!needle) return x
          if (!props.filterKeys && Array.isArray(x) && x.every((e) => typeof e === "string")) {
            return fuzzysort.go(needle, x).map((x) => x.target) as T[]
          }
          return fuzzysort.go(needle, x, { keys: props.filterKeys! }).map((x) => x.obj)
        },
        groupBy((x) => (props.groupBy ? props.groupBy(x) : "")),
        entries(),
        map(([k, v]) => ({ category: k, items: props.sortBy ? v.sort(props.sortBy) : v })),
        (groups) => (props.sortGroupsBy ? groups.sort(props.sortGroupsBy) : groups),
      )
      return result
    },
  )

  const flat = createMemo(() => {
    return pipe(
      grouped() || [],
      flatMap((x) => x.items),
    )
  })

  const list = createList({
    items: () => flat().map(props.key),
    initialActive: props.current ? props.key(props.current) : props.key(flat()[0]),
    loop: true,
  })

  const reset = () => {
    const all = flat()
    if (all.length === 0) return
    list.setActive(props.key(all[0]))
  }

  const onKeyDown = (event: KeyboardEvent) => {
    // Emacs-style navigation
    if (event.ctrlKey && !event.altKey && !event.shiftKey) {
      switch (event.key) {
        case 'n':
          event.preventDefault()
          list.next()
          return
        case 'p':
          event.preventDefault()
          list.previous()
          return
        case 'f':
          event.preventDefault()
          list.next()
          return
        case 'b':
          event.preventDefault()
          list.previous()
          return
        case 'a':
          event.preventDefault()
          // Move to beginning of list (first item)
          list.setActive(props.key(flat()[0]))
          return
        case 'e':
          event.preventDefault()
          // Move to end of list (last item)
          list.setActive(props.key(flat()[flat().length - 1]))
          return
        case 'k':
          event.preventDefault()
          // Delete current item (if supported)
          return
        case 'y':
          event.preventDefault()
          // Yank/copy current item (if supported)
          return
      }
    }
    
    // Vi-style navigation
    if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
      switch (event.key) {
        case 'j':
          event.preventDefault()
          list.next()
          return
        case 'k':
          event.preventDefault()
          list.previous()
          return
        case 'h':
          event.preventDefault()
          list.previous()
          return
        case 'l':
          event.preventDefault()
          list.next()
          return
        case 'g':
          event.preventDefault()
          // gg - go to first item
          setTimeout(() => {
            if (event.key === 'g' && document.activeElement?.textContent === 'g') {
              list.setActive(props.key(flat()[0]))
            }
          }, 10)
          return
        case 'G':
          event.preventDefault()
          // G - go to last item
          list.setActive(props.key(flat()[flat().length - 1]))
          return
      }
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const selected = flat().find((x) => props.key(x) === list.active())
      if (selected) props.onSelect?.(selected)
    } else {
      list.onKeyDown(event)
    }
  } else {
      list.onKeyDown(event)
    }
  }

  const onInput = (value: string) => {
    setStore("filter", value)
    reset()
  }

  return {
    grouped,
    filter: () => store.filter,
    flat,
    reset,
    refetch,
    clear: () => setStore("filter", ""),
    onKeyDown,
    onInput,
    active: list.active,
    setActive: list.setActive,
  }
}
