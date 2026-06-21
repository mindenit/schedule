/**
 * Registers global keyboard shortcuts for calendar navigation.
 *
 * Call once from app.vue. useEventListener cleans up automatically on unmount.
 *
 * Guard: shortcuts are ignored when the event originates from an interactive
 * element (input, textarea, contenteditable) or when a dialog/popover has
 * focus (Reka UI sets role="dialog" on open overlays).
 */
export function useKeyboardShortcuts() {
	const calendarStore = useCalendarStore()
	const { selectedDate, view } = storeToRefs(calendarStore)
	const { trackEvent } = useAnalytics()

	const isShortcutsOpen = ref(false)

	function isInInteractiveContext(e: KeyboardEvent): boolean {
		const target = e.target as HTMLElement
		if (!target) return false

		// Ignore when typing inside form controls or editable content
		const tag = target.tagName
		if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return true

		// Ignore when a Reka UI dialog / popover / select has focus
		if (target.closest('[role="dialog"], [role="listbox"], [role="menu"], [data-state="open"]'))
			return true

		return false
	}

	useEventListener("keydown", (e: KeyboardEvent) => {
		if (isInInteractiveContext(e)) return

		switch (e.key) {
			case "ArrowLeft": {
				e.preventDefault()
				const prev = navigateDate(selectedDate.value, view.value, "previous")
				calendarStore.setSelectedDate(prev)
				trackEvent("date_navigated", { direction: "prev", view: view.value, source: "keyboard" })
				break
			}
			case "ArrowRight": {
				e.preventDefault()
				const next = navigateDate(selectedDate.value, view.value, "next")
				calendarStore.setSelectedDate(next)
				trackEvent("date_navigated", { direction: "next", view: view.value, source: "keyboard" })
				break
			}
			case "t":
			case "T": {
				// Compute today fresh on each keypress (avoids stale date if tab is left open overnight)
				calendarStore.setSelectedDate(new Date())
				trackEvent("date_navigated", { direction: "today", view: view.value, source: "keyboard" })
				break
			}
			case "d":
			case "D": {
				calendarStore.setView("day")
				trackEvent("view_changed", { view: "day", source: "keyboard" })
				break
			}
			case "w":
			case "W": {
				calendarStore.setView("week")
				trackEvent("view_changed", { view: "week", source: "keyboard" })
				break
			}
			case "m":
			case "M": {
				calendarStore.setView("month")
				trackEvent("view_changed", { view: "month", source: "keyboard" })
				break
			}
			case "?": {
				isShortcutsOpen.value = !isShortcutsOpen.value
				break
			}
		}
	})

	return { isShortcutsOpen }
}
