import { defineStore } from "pinia"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import type { Schedule } from "nurekit"

export const useCalendarStore = defineStore("calendar", () => {
	const allEvents = ref<Schedule[]>([])
	const selectedDate = ref(new Date())
	const selectedEventTypes = ref<TEventType[]>([])
	const isInitialized = ref(false)

	const view = ref<TCalendarView>("month")

	const initializeStore = () => {
		if (import.meta.client && !isInitialized.value) {
			const savedView = localStorage.getItem("calendar-view")
			if (savedView && ["month", "week", "day"].includes(savedView)) {
				view.value = savedView as TCalendarView
			}
			isInitialized.value = true
		}
	}

	onMounted(() => {
		initializeStore()
	})

	const filteredEvents = computed(() => {
		const eventsFilteredByType =
			selectedEventTypes.value.length > 0
				? allEvents.value.filter((event) =>
						selectedEventTypes.value.includes(event.type as TEventType)
					)
				: allEvents.value

		if (view.value === "month") {
			return getEventsForMonthView(eventsFilteredByType)
		} else if (view.value === "week") {
			return getEventsForWeekView(eventsFilteredByType)
		} else if (view.value === "day") {
			return getEventsForDayView(eventsFilteredByType)
		}

		return eventsFilteredByType
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

		if (import.meta.client && isInitialized.value) {
			localStorage.setItem("calendar-view", newView)
		}
	}

	function setSelectedDate(date: Date | undefined) {
		if (date) {
			selectedDate.value = date
		}
	}

	function filterByEventType(eventType: TEventType) {
		const typeIndex = selectedEventTypes.value.indexOf(eventType)

		if (typeIndex > -1) {
			selectedEventTypes.value.splice(typeIndex, 1)
		} else {
			selectedEventTypes.value.push(eventType)
		}
	}

	function clearFilter() {
		selectedEventTypes.value = []
	}

	function addEvent(event: Schedule) {
		allEvents.value.push(event)
	}

	function updateEvent(updatedEvent: Schedule) {
		const index = allEvents.value.findIndex((e) => e.id === updatedEvent.id)
		if (index !== -1) {
			allEvents.value[index] = updatedEvent
		}
	}

	function removeEvent(eventId: number) {
		allEvents.value = allEvents.value.filter((e) => e.id !== eventId)
	}

	if (import.meta.client) {
		initializeStore()
	}

	return {
		allEvents,
		selectedDate,
		selectedEventTypes,
		isInitialized: readonly(isInitialized),

		view,
		filteredEvents,

		setEvents,
		setView,
		setSelectedDate,
		filterByEventType,
		clearFilter,
		addEvent,
		updateEvent,
		removeEvent,
		initializeStore,
	}
})
