import {
	isSameDay,
	startOfDay,
	differenceInMinutes,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
} from "date-fns"

export const useEventGrouping = () => {
	const groupEvents = (dayEvents: ICalendarEvent[]): ICalendarEvent[][] => {
		const sortedEvents = [...dayEvents].sort((a, b) => a.startedAt - b.startedAt)
		const groups: ICalendarEvent[][] = []

		for (const event of sortedEvents) {
			const eventStart = new Date(event.startedAt)
			let placed = false

			for (const group of groups) {
				const lastEventInGroup = group[group.length - 1]
				if (!lastEventInGroup) continue
				const lastEventEnd = new Date(lastEventInGroup.endedAt)

				if (eventStart >= lastEventEnd) {
					group.push(event)
					placed = true
					break
				}
			}

			if (!placed) groups.push([event])
		}

		return groups
	}

	const groupEventsBySameTime = (events: ICalendarEvent[]): ICalendarEvent[][] => {
		const timeGroups = new Map<string, ICalendarEvent[]>()

		for (const event of events) {
			const timeKey = `${event.startedAt}-${event.endedAt}`

			if (!timeGroups.has(timeKey)) {
				timeGroups.set(timeKey, [])
			}
			timeGroups.get(timeKey)!.push(event)
		}

		return Array.from(timeGroups.values()).sort((a, b) => a[0]!.startedAt - b[0]!.startedAt)
	}

	const getEventsForDate = (events: ICalendarEvent[], date: Date): ICalendarEvent[] => {
		return events.filter((event) => {
			const eventDate = new Date(event.startedAt)
			return isSameDay(eventDate, date)
		})
	}

	const getEventsForDateRange = (
		events: ICalendarEvent[],
		startDate: Date,
		endDate: Date
	): ICalendarEvent[] => {
		return events.filter((event) => {
			const eventStartDate = new Date(event.startedAt)
			const eventEndDate = new Date(event.endedAt)
			return eventStartDate <= endDate && eventEndDate >= startDate
		})
	}

	const calculateEventPositions = (
		events: ICalendarEvent[],
		selectedDate: Date
	): Record<string, number> => {
		const monthStart = startOfMonth(selectedDate)
		const monthEnd = endOfMonth(selectedDate)
		const calendarStart = startOfWeek(monthStart, WEEK_OPTIONS)
		const calendarEnd = endOfWeek(monthEnd, WEEK_OPTIONS)

		const positions: Record<string, number> = {}
		const occupiedPositions: Record<string, boolean[]> = {}

		for (const day of eachDayOfInterval({ start: calendarStart, end: calendarEnd })) {
			occupiedPositions[day.toISOString()] = Array(MAX_EVENT_POSITIONS).fill(false)
		}

		const sortedEvents = [...events].sort((a, b) => a.startedAt - b.startedAt)

		for (const event of sortedEvents) {
			const eventDate = startOfDay(new Date(event.startedAt))

			if (eventDate >= calendarStart && eventDate <= calendarEnd) {
				const dayKey = eventDate.toISOString()
				const dayPositions = occupiedPositions[dayKey]

				if (dayPositions) {
					let position = -1
					for (let i = 0; i < MAX_EVENT_POSITIONS; i++) {
						if (!dayPositions[i]) {
							position = i
							break
						}
					}

					if (position !== -1) {
						dayPositions[position] = true
						positions[String(event.id)] = position
					}
				}
			}
		}

		return positions
	}

	const getEventBlockStyle = (
		event: ICalendarEvent,
		day: Date,
		groupIndex: number,
		groupSize: number
	) => {
		const startDate = new Date(event.startedAt)
		const dayStart = startOfDay(day)
		const eventStart = startDate < dayStart ? dayStart : startDate
		const startMinutes = differenceInMinutes(eventStart, dayStart)

		const top = (startMinutes / 1440) * 100
		const width = 100 / groupSize
		const left = groupIndex * width

		return { top: `${top}%`, width: `${width}%`, left: `${left}%` }
	}

	return {
		groupEvents,
		groupEventsBySameTime,
		getEventsForDate,
		getEventsForDateRange,
		calculateEventPositions,
		getEventBlockStyle,
	}
}
