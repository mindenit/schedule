import { defineStore, storeToRefs } from "pinia"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns"
import type { Schedule } from "@mindenit/nurekit"
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
	const _selectedDateStr = useState<string>("calendar:selectedDate", () =>
		new Date().toISOString()
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
	//
	// Two-slot TZ cache: if the user bounces between two timezones (e.g. local ↔
	// Europe/Kyiv) without a schedule change in between, the second switch reuses
	// the already-built index instead of scanning all events again.
	// The cache is keyed by both the events array reference AND the timezone string
	// so stale entries are never returned after a schedule switch.
	let _tzCacheEvents: Schedule[] | null = null
	const _tzCache = new Map<string, Map<number, Schedule[]>>()

	const eventsByDayKey = computed(() => {
		const tz = effectiveTimezone.value
		const events = allEvents.value

		// Invalidate the per-TZ cache whenever the events array reference changes
		// (i.e. setEvents() was called with a new schedule response).
		if (events !== _tzCacheEvents) {
			_tzCache.clear()
			_tzCacheEvents = events
		}

		if (!_tzCache.has(tz)) {
			// Evict the oldest entry when cache exceeds two slots to cap memory.
			if (_tzCache.size >= 2) {
				const firstKey = _tzCache.keys().next().value
				if (firstKey !== undefined) _tzCache.delete(firstKey)
			}

			const map = new Map<number, Schedule[]>()
			for (const event of events) {
				const key = getEventDayKey(event, tz)
				let bucket = map.get(key)
				if (!bucket) {
					bucket = []
					map.set(key, bucket)
				}
				bucket.push(event)
			}
			_tzCache.set(tz, map)
		}

		return _tzCache.get(tz)!
	})

	const filteredEvents = computed(() => {
		if (view.value === "month") {
			return getEventsForMonthView(allEvents.value)
		} else if (view.value === "year") {
			return getEventsForYearView(allEvents.value)
		}

		// Day and week views receive the full allEvents array.
		// Their buildPanel functions call getEventsForDate/getEventsForDateRange
		// internally, which correctly filters per-panel. Pre-filtering here would
		// clip peek panels for adjacent days/weeks to an empty array.
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
