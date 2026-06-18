import { defineStore } from "pinia"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import type { Schedule } from "nurekit"
import type { TCalendarView } from "~/types/calendar"
import { WEEK_OPTIONS } from "~/constants/calendar"

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
		const calendarStart = startOfWeek(monthStart, WEEK_OPTIONS)
		const calendarEnd = endOfWeek(monthEnd, WEEK_OPTIONS)

		return events.filter((event) => {
			const eventStartedAt = new Date(event.startedAt * 1000)
			const eventEndedAt = new Date(event.endedAt * 1000)
			return eventStartedAt <= calendarEnd && eventEndedAt >= calendarStart
		})
	}

	function getEventsForWeekView(events: Schedule[]): Schedule[] {
		const calendarStart = startOfWeek(selectedDate.value, WEEK_OPTIONS)
		const calendarEnd = endOfWeek(selectedDate.value, WEEK_OPTIONS)

		return events.filter((event) => {
			const eventStartedAt = new Date(event.startedAt * 1000)
			const eventEndedAt = new Date(event.endedAt * 1000)
			return eventStartedAt <= calendarEnd && eventEndedAt >= calendarStart
		})
	}

	function getEventsForDayView(events: Schedule[]): Schedule[] {
		const dayStart = new Date(selectedDate.value)
		dayStart.setHours(0, 0, 0, 0)
		const dayEnd = new Date(selectedDate.value)
		dayEnd.setHours(23, 59, 59, 999)

		return events.filter((event) => {
			const eventStartedAt = new Date(event.startedAt * 1000)
			const eventEndedAt = new Date(event.endedAt * 1000)
			return eventStartedAt <= dayEnd && eventEndedAt >= dayStart
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
		setEvents,
		setView,
		setSelectedDate,
	}
})
