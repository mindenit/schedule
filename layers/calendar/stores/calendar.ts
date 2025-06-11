import { ref, computed } from "vue"
import { defineStore } from "pinia"
import { useStorage } from "@vueuse/core"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import type { ICalendarEvent, TCalendarView, TEventType } from "../types"

interface CalendarSettings {
	view: TCalendarView
	use24HourFormat: boolean
}

const DEFAULT_SETTINGS: CalendarSettings = {
	view: "month",
	use24HourFormat: true,
}

const weekOptions = { weekStartsOn: 1 as const }

export const useCalendarStore = defineStore("calendar", () => {
	const allEvents = ref<ICalendarEvent[]>([])
	const selectedDate = ref(new Date())
	const selectedEventTypes = ref<TEventType[]>([])
	const settings = useStorage("calendar-settings", DEFAULT_SETTINGS)

	const view = computed(() => settings.value.view)
	const use24HourFormat = computed(() => settings.value.use24HourFormat)

	const filteredEvents = computed(() => {
		const eventsFilteredByType =
			selectedEventTypes.value.length > 0
				? allEvents.value.filter((event) => selectedEventTypes.value.includes(event.type))
				: allEvents.value

		if (view.value === "month") {
			const monthStart = startOfMonth(selectedDate.value)
			const monthEnd = endOfMonth(selectedDate.value)

			const calendarStart = startOfWeek(monthStart, weekOptions)
			const calendarEnd = endOfWeek(monthEnd, weekOptions)

			return eventsFilteredByType.filter((event) => {
				const eventStartDate = new Date(event.startDate)
				const eventEndDate = new Date(event.endDate)
				return eventStartDate <= calendarEnd && eventEndDate >= calendarStart
			})
		}

		const monthStart = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1)
		const monthEnd = new Date(
			selectedDate.value.getFullYear(),
			selectedDate.value.getMonth() + 1,
			0
		)

		return eventsFilteredByType.filter((event) => {
			const eventStartDate = new Date(event.startDate)
			const eventEndDate = new Date(event.endDate)
			return eventStartDate <= monthEnd && eventEndDate >= monthStart
		})
	})

	function setEvents(initialEvents: ICalendarEvent[]) {
		allEvents.value = initialEvents
	}

	function setView(newView: TCalendarView) {
		settings.value.view = newView
	}

	function toggleTimeFormat() {
		settings.value.use24HourFormat = !settings.value.use24HourFormat
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

	function addEvent(event: ICalendarEvent) {
		allEvents.value.push(event)
	}

	function updateEvent(updatedEvent: ICalendarEvent) {
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
		use24HourFormat,
		filteredEvents,
		setEvents,
		setView,
		toggleTimeFormat,
		setSelectedDate,
		filterByEventType,
		clearFilter,
		addEvent,
		updateEvent,
		removeEvent,
	}
})
