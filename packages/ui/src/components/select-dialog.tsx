import { createEffect, Show, For, type JSX, splitProps } from "solid-js"
import { Dialog, DialogProps, Icon, IconButton, Input } from "@opencode-ai/ui"
import { createStore } from "solid-js/store"
import { FilteredListProps, useFilteredList } from "@opencode-ai/ui/hooks"

interface SelectDialogProps<T>
  extends FilteredListProps<T>,
    Pick<DialogProps, "trigger" | "onOpenChange" | "defaultOpen"> {
  title: string
  placeholder?: string
  emptyMessage?: string
  children: (item: T) => JSX.Element
  onSelect?: (value: T | undefined) => void
}

export function SelectDialog<T>(props: SelectDialogProps<T>) {
  const [dialog, others] = splitProps(props, ["trigger", "onOpenChange", "defaultOpen"])
  let closeButton!: HTMLButtonElement
  let scrollRef: HTMLDivElement | undefined
  const [store, setStore] = createStore({
    mouseActive: false,
  })

  const { filter, grouped, flat, reset, clear, active, setActive, onKeyDown, onInput } = useFilteredList<T>({
    items: others.items,
    key: others.key,
    filterKeys: others.filterKeys,
    current: others.current,
    groupBy: others.groupBy,
    sortBy: others.sortBy,
    sortGroupsBy: others.sortGroupsBy,
  })

  createEffect(() => {
    filter()
    scrollRef?.scrollTo(0, 0)
    reset()
  })

  createEffect(() => {
    const all = flat()
    if (store.mouseActive || all.length === 0) return
    if (active() === others.key(all[0])) {
      scrollRef?.scrollTo(0, 0)
      return
    }
    const element = scrollRef?.querySelector(`[data-key="${active()}"]`)
    element?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  })

  const handleInput = (value: string) => {
    onInput(value)
    reset()
  }

  const handleSelect = (item: T | undefined) => {
    others.onSelect?.(item)
    closeButton.click()
  }

  const handleKey = (e: KeyboardEvent) => {
    setStore("mouseActive", false)
    if (e.key === "Escape") return

    // Emacs-style navigation
    if (e.ctrlKey && !e.altKey && !e.shiftKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault()
          list.next()
          return
        case 'p':
          e.preventDefault()
          list.previous()
          return
        case 'f':
          e.preventDefault()
          list.next()
          return
        case 'b':
          e.preventDefault()
          list.previous()
          return
        case 'a':
          e.preventDefault()
          // Move to first item
          const all = flat()
          if (all.length > 0) {
            list.setActive(others.key(all[0]))
          }
          return
        case 'e':
          e.preventDefault()
          // Move to last item
          const allItems = flat()
          if (allItems.length > 0) {
            list.setActive(others.key(allItems[allItems.length - 1]))
          }
          return
        case 'v':
          e.preventDefault()
          // Page up
          for (let i = 0; i < 10; i++) list.previous()
          return
      }
    }
    
    // Vi-style navigation
    if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
      switch (e.key) {
        case 'j':
          e.preventDefault()
          list.next()
          return
        case 'k':
          e.preventDefault()
          list.previous()
          return
        case 'h':
          e.preventDefault()
          list.previous()
          return
        case 'l':
          e.preventDefault()
          list.next()
          return
        case 'g':
          e.preventDefault()
          // gg - go to first item (detect double g)
          setTimeout(() => {
            const active = document.activeElement
            if (active && (active as HTMLElement).textContent === 'g') {
              const all = flat()
              if (all.length > 0) {
                list.setActive(others.key(all[0]))
              }
            }
          }, 10)
          return
        case 'G':
          e.preventDefault()
          // G - go to last item
          const items = flat()
          if (items.length > 0) {
            list.setActive(others.key(items[items.length - 1]))
          }
          return
        case 'u':
          e.preventDefault()
          // Page up
          for (let i = 0; i < 10; i++) list.previous()
          return
        case 'd':
          e.preventDefault()
          // Page down
          for (let i = 0; i < 10; i++) list.next()
          return
      }
    }

    if (e.key === "Enter") {
      e.preventDefault()
      const selected = flat().find((x) => others.key(x) === list.active())
      if (selected) handleSelect(selected)
    } else {
      onKeyDown(e)
    }
  } else {
      onKeyDown(e)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) clear()
    props.onOpenChange?.(open)
  }

  return (
    <Dialog modal {...dialog} onOpenChange={handleOpenChange}>
      <Dialog.Header>
        <Dialog.Title>{others.title}</Dialog.Title>
        <Dialog.CloseButton ref={closeButton} style={{ display: "none" }} />
      </Dialog.Header>
      <div data-component="select-dialog-input">
        <div data-slot="input-container">
          <Icon data-slot="icon" name="magnifying-glass" />
          <Input
            data-slot="input"
            type="text"
            value={filter()}
            onChange={(value) => handleInput(value)}
            onKeyDown={handleKey}
            placeholder={others.placeholder}
            autofocus
            spellcheck={false}
            autocorrect="off"
            autocomplete="off"
            autocapitalize="off"
          />
        </div>
        <Show when={filter()}>
          <IconButton
            data-slot="clear-button"
            icon="circle-x"
            variant="ghost"
            onClick={() => {
              onInput("")
              reset()
            }}
          />
        </Show>
      </div>
      <Dialog.Body ref={scrollRef} data-component="select-dialog" class="no-scrollbar">
        <Show
          when={flat().length > 0}
          fallback={
            <div data-slot="empty-state">
              <div data-slot="message">
                {props.emptyMessage ?? "No search results"} for <span data-slot="filter">&quot;{filter()}&quot;</span>
              </div>
            </div>
          }
        >
          <For each={grouped()}>
            {(group) => (
              <div data-slot="group">
                <Show when={group.category}>
                  <div data-slot="header">{group.category}</div>
                </Show>
                <div data-slot="list">
                  <For each={group.items}>
                    {(item) => (
                      <button
                        data-slot="item"
                        data-key={others.key(item)}
                        data-active={others.key(item) === active()}
                        onClick={() => handleSelect(item)}
                        onMouseMove={() => {
                          setStore("mouseActive", true)
                          setActive(others.key(item))
                        }}
                      >
                        {others.children(item)}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </Show>
      </Dialog.Body>
    </Dialog>
  )
}
