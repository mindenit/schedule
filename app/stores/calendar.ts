import { defineStore } from "pinia"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import type { Schedule } from "nurekit"
import type { TCalendarView } from "~/types/calendar"
import { WEEK_OPTIONS } from "~/constants/calendar"
import { getEventDayKey } from "~/utils/event-cache"

const VALID_VIEWS: TCalendarView[] = ["month", "week", "day"]

export const useCalendarStore = defineStore("calendar", () => {
	const allEvents = ref<Schedule[]>([])
	const selectedDate = ref(new Date())

	// useCookie is SSR-compatible: server reads the cookie from the request,
	// client reads/writes it reactively. This means SSR renders the correct
	// view (no hydration mismatch) and the value persists across page loads.
	// When the team adds ?view= URL param support, read that first and fall
	// back to this cookie as the persistent default.
	const viewCookie = useCookie<TCalendarView>("calendar-view", {
		default: () => "month",
	})

	const view = computed({
		get: () => (VALID_VIEWS.includes(viewCookie.value) ? viewCookie.value : "month"),
		set: (v: TCalendarView) => {
			viewCookie.value = v
		},
	})

	// Pre-indexed by day-start Unix ms. Rebuilds only when allEvents changes
	// (i.e. on a new network fetch), not on selectedDate navigation.
	// MonthView reads from this map directly so month switching never rebuilds
	// the index — it's just 42 Map.get() calls regardless of event count.
	const eventsByDayKey = computed(() => {
		const map = new Map<number, Schedule[]>()
		for (const event of allEvents.value) {
			const key = getEventDayKey(event)
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

	return {
		allEvents,
		selectedDate,
		view,
		filteredEvents,
		eventsByDayKey,
		setEvents,
		setView,
		setSelectedDate,
	}
})
