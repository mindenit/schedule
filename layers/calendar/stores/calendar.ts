import { defineStore } from "pinia"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import type { Schedule } from "nurekit"

export const useCalendarStore = defineStore("calendar", () => {
	const allEvents = ref<Schedule[]>([])
	const selectedDate = ref(new Date())
	const selectedEventTypes = ref<TEventType[]>([])

	const view = ref<TCalendarView>("month")

	onMounted(() => {
		if (import.meta.client) {
			const savedView = localStorage.getItem("calendar-view")
			if (savedView && ["month", "week", "day"].includes(savedView)) {
				view.value = savedView as TCalendarView
			}
		}
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
		}

		return getEventsForCurrentMonth(eventsFilteredByType)
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

	function getEventsForCurrentMonth(events: Schedule[]): Schedule[] {
		const monthStart = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1)
		const monthEnd = new Date(
			selectedDate.value.getFullYear(),
			selectedDate.value.getMonth() + 1,
			0
		)

		return events.filter((event) => {
			const eventStartedAt = new Date(event.startedAt * 1000)
			const eventEndedAt = new Date(event.endedAt * 1000)
			return eventStartedAt <= monthEnd && eventEndedAt >= monthStart
		})
	}

	function setEvents(initialEvents: Schedule[]) {
		allEvents.value = initialEvents
	}

	function setView(newView: TCalendarView) {
		view.value = newView

		if (import.meta.client) {
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

	return {
		allEvents,
		selectedDate,
		selectedEventTypes,

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
	}
})
