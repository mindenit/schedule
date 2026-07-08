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

	// useState keeps one shared ref across all composable call-sites (app.vue + settings).
	const isShortcutsOpen = useState("shortcuts:open", () => false)

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

		// e.key is layout-dependent (gives Cyrillic on UA/RU keyboards).
		// e.code is layout-independent (physical key position) and is used as
		// a fallback so shortcuts work regardless of the active input language.
		const key = e.key
		const code = e.code

		if (code === "ArrowLeft") {
			e.preventDefault()
			const prev = navigateDate(selectedDate.value, view.value, "previous")
			calendarStore.setSelectedDate(prev)
			trackEvent("date_navigated", {
				direction: "prev",
				view: view.value,
				source: "keyboard",
			})
			return
		}

		if (code === "ArrowRight") {
			e.preventDefault()
			const next = navigateDate(selectedDate.value, view.value, "next")
			calendarStore.setSelectedDate(next)
			trackEvent("date_navigated", {
				direction: "next",
				view: view.value,
				source: "keyboard",
			})
			return
		}

		// For letter shortcuts: match by e.key (EN layout) OR e.code (any layout).
		// e.g. Ukrainian "е" key has code "KeyT" — both paths resolve to today.
		if (key === "t" || key === "T" || code === "KeyT") {
			// Compute today fresh on each keypress (avoids stale date if tab is left open overnight)
			calendarStore.setSelectedDate(new Date())
			trackEvent("date_navigated", {
				direction: "today",
				view: view.value,
				source: "keyboard",
			})
			return
		}

		if (key === "d" || key === "D" || code === "KeyD") {
			calendarStore.setView("day")
			trackEvent("view_changed", { view: "day", source: "keyboard" })
			return
		}

		if (key === "w" || key === "W" || code === "KeyW") {
			calendarStore.setView("week")
			trackEvent("view_changed", { view: "week", source: "keyboard" })
			return
		}

		if (key === "m" || key === "M" || code === "KeyM") {
			calendarStore.setView("month")
			trackEvent("view_changed", { view: "month", source: "keyboard" })
			return
		}

		if (key === "y" || key === "Y" || code === "KeyY") {
			calendarStore.setView("year")
			trackEvent("view_changed", { view: "year", source: "keyboard" })
			return
		}

		// "?" is Shift+Slash on EN. On other layouts e.key won't be "?" so we
		// also accept Shift+Slash by physical key (code) as a universal fallback.
		if (key === "?" || (code === "Slash" && e.shiftKey)) {
			if (!isShortcutsOpen.value) trackEvent("shortcuts_dialog_opened")
			isShortcutsOpen.value = !isShortcutsOpen.value
		}
	})

	return { isShortcutsOpen }
}
