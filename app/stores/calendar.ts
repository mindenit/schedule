import { defineStore, storeToRefs } from "pinia"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns"
import type { Schedule } from "nurekit"
import type { TCalendarView } from "~/types/calendar"
import { WEEK_OPTIONS } from "~/constants/calendar"
import { STORAGE_KEYS } from "~/constants/storage"
import { resolveTimezone } from "~/constants/timezones"
import { getEventDayKey } from "~/utils/event-cache"

const VALID_VIEWS: TCalendarView[] = ["month", "week", "day", "year"]

export const useCalendarStore = defineStore("calendar", () => {
	const settingsStore = useSettingsStore()
	const { timezone } = storeToRefs(settingsStore)
	const effectiveTimezone = computed(() => resolveTimezone(timezone.value))

	const allEvents = ref<Schedule[]>([])
	// useState keeps the value stable across SSR → client hydration.
	// ref(new Date()) would differ between server render time and client
	// hydration time, causing a hydration mismatch on every page load.
	// Nuxt serialises useState as JSON, so Date → ISO string in the payload.
	// We store a string internally and expose a computed Date so consumers
	// are unchanged, and the serialised form is unambiguously a primitive.
	const _selectedDateStr = useState<string>(
		"calendar:selectedDate",
		() => new Date().toISOString()
	)
	// Cache the last parsed Date so repeated reads of selectedDate.value return
	// the same object reference, eliminating per-read allocations and preventing
	// referential inequality in watchers that compare dates by identity.
	let _dateCache: { str: string; date: Date } | null = null
	const selectedDate = computed({
		get: () => {
			const str = _selectedDateStr.value
			if (!_dateCache || _dateCache.str !== str) {
				_dateCache = { str, date: new Date(str) }
			}
			return _dateCache.date
		},
		set: (d: Date) => {
			_selectedDateStr.value = d.toISOString()
		},
	})

	// Tracks the animation direction for the most recent navigation action.
	// "left"  = forward in time (next month/day)
	// "right" = backward in time (previous month/day)
	// null    = no animation (initial load, today button, etc.)
	const navigationDirection = ref<"left" | "right" | null>(null)

	// useCookie is SSR-compatible: server reads the cookie from the request,
	// client reads/writes it reactively. This means SSR renders the correct
	// view (no hydration mismatch) and the value persists across page loads.
	// When the team adds ?view= URL param support, read that first and fall
	// back to this cookie as the persistent default.
	const viewCookie = useCookie<TCalendarView>(STORAGE_KEYS.calendarView, {
		default: () => "month",
	})

	const view = computed({
		get: () => (VALID_VIEWS.includes(viewCookie.value) ? viewCookie.value : "month"),
		set: (v: TCalendarView) => {
			viewCookie.value = v
		},
	})

	// Pre-indexed by day-start Unix ms. Rebuilds when allEvents or the timezone
	// changes. MonthView reads from this map directly so month switching never
	// rebuilds the index — it's just 42 Map.get() calls regardless of event count.
	const eventsByDayKey = computed(() => {
		const tz = effectiveTimezone.value
		const map = new Map<number, Schedule[]>()
		for (const event of allEvents.value) {
			const key = getEventDayKey(event, tz)
			let bucket = map.get(key)
			if (!bucket) {
				bucket = []
				map.set(key, bucket)
			}
			bucket.push(event)
		}
		return map
	})

	const filteredEvents = computed(() => {
		if (view.value === "month") {
			return getEventsForMonthView(allEvents.value)
		} else if (view.value === "week") {
			return getEventsForWeekView(allEvents.value)
		} else if (view.value === "day") {
			return getEventsForDayView(allEvents.value)
		} else if (view.value === "year") {
			return getEventsForYearView(allEvents.value)
		}

		return allEvents.value
	})

	function getEventsForMonthView(events: Schedule[]): Schedule[] {
		const monthStart = startOfMonth(selectedDate.value)
		const monthEnd = endOfMonth(selectedDate.value)
		const rangeStart = startOfWeek(monthStart, WEEK_OPTIONS).getTime()
		const rangeEnd = endOfWeek(monthEnd, WEEK_OPTIONS).getTime()

		return events.filter((event) => {
			return event.startedAt * 1000 <= rangeEnd && event.endedAt * 1000 >= rangeStart
		})
	}

	function getEventsForWeekView(events: Schedule[]): Schedule[] {
		const rangeStart = startOfWeek(selectedDate.value, WEEK_OPTIONS).getTime()
		const rangeEnd = endOfWeek(selectedDate.value, WEEK_OPTIONS).getTime()

		return events.filter((event) => {
			return event.startedAt * 1000 <= rangeEnd && event.endedAt * 1000 >= rangeStart
		})
	}

	function getEventsForDayView(events: Schedule[]): Schedule[] {
		const day = selectedDate.value
		const rangeStart = new Date(
			day.getFullYear(),
			day.getMonth(),
			day.getDate(),
			0,
			0,
			0,
			0
		).getTime()
		const rangeEnd = new Date(
			day.getFullYear(),
			day.getMonth(),
			day.getDate(),
			23,
			59,
			59,
			999
		).getTime()

		return events.filter((event) => {
			return event.startedAt * 1000 <= rangeEnd && event.endedAt * 1000 >= rangeStart
		})
	}

	function getEventsForYearView(events: Schedule[]): Schedule[] {
		const rangeStart = startOfYear(selectedDate.value).getTime()
		const rangeEnd = endOfYear(selectedDate.value).getTime()

		return events.filter((event) => {
			return event.startedAt * 1000 <= rangeEnd && event.endedAt * 1000 >= rangeStart
		})
	}

	function setEvents(initialEvents: Schedule[]) {
		allEvents.value = initialEvents
	}

	function setView(newView: TCalendarView) {
		view.value = newView
	}

	function setSelectedDate(date: Date | undefined) {
		if (date) {
			selectedDate.value = date
		}
	}

	function setNavigationDirection(direction: "left" | "right" | null) {
		navigationDirection.value = direction
	}

	return {
		allEvents,
		selectedDate,
		view,
		filteredEvents,
		eventsByDayKey,
		navigationDirection,
		setEvents,
		setView,
		setSelectedDate,
		setNavigationDirection,
	}
})
