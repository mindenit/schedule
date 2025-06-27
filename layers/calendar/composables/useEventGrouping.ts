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
import type { Schedule } from "nurekit"

export const useEventGrouping = () => {
	const groupEvents = (dayEvents: Schedule[]): Schedule[][] => {
		const sortedEvents = [...dayEvents].sort((a, b) => {
			const startA = parseDate(a.startedAt).getTime()
			const startB = parseDate(b.startedAt).getTime()
			return startA - startB
		})

		const groups: Schedule[][] = []

		for (const event of sortedEvents) {
			const eventStart = parseDate(event.startedAt)
			let placed = false

			for (const group of groups) {
				const lastEventInGroup = group[group.length - 1]
				if (!lastEventInGroup) continue

				const lastEventEnd = parseDate(lastEventInGroup.endedAt)

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

	const groupEventsBySameTime = (events: Schedule[]): Schedule[][] => {
		const timeGroups = new Map<string, Schedule[]>()

		for (const event of events) {
			const startTime = parseDate(event.startedAt).getTime()
			const endTime = parseDate(event.endedAt).getTime()
			const timeKey = `${startTime}-${endTime}`

			if (!timeGroups.has(timeKey)) {
				timeGroups.set(timeKey, [])
			}
			timeGroups.get(timeKey)!.push(event)
		}

		return Array.from(timeGroups.values()).sort((a, b) => {
			const startA = parseDate(a[0]!.startedAt).getTime()
			const startB = parseDate(b[0]!.startedAt).getTime()
			return startA - startB
		})
	}

	const getEventsForDate = (events: Schedule[], date: Date | string | number): Schedule[] => {
		const targetDate = parseDate(date)

		return events.filter((event) => {
			const eventDate = parseDate(event.startedAt)
			return isSameDay(eventDate, targetDate)
		})
	}

	const getEventsForDateRange = (
		events: Schedule[],
		startDate: Date | string | number,
		endDate: Date | string | number
	): Schedule[] => {
		const start = parseDate(startDate)
		const end = parseDate(endDate)

		return events.filter((event) => {
			const eventStartDate = parseDate(event.startedAt)
			const eventEndDate = parseDate(event.endedAt)
			return eventStartDate <= end && eventEndDate >= start
		})
	}

	const calculateEventPositions = (
		events: Schedule[],
		selectedDate: Date | string | number
	): Record<string, number> => {
		const selected = parseDate(selectedDate)
		const monthStart = startOfMonth(selected)
		const monthEnd = endOfMonth(selected)
		const calendarStart = startOfWeek(monthStart, WEEK_OPTIONS)
		const calendarEnd = endOfWeek(monthEnd, WEEK_OPTIONS)

		const positions: Record<string, number> = {}
		const occupiedPositions: Record<string, boolean[]> = {}

		for (const day of eachDayOfInterval({ start: calendarStart, end: calendarEnd })) {
			occupiedPositions[day.toISOString()] = Array(MAX_EVENT_POSITIONS).fill(false)
		}

		const sortedEvents = [...events].sort((a, b) => {
			const startA = parseDate(a.startedAt).getTime()
			const startB = parseDate(b.startedAt).getTime()
			return startA - startB
		})

		for (const event of sortedEvents) {
			const eventDate = startOfDay(parseDate(event.startedAt))

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
		event: Schedule,
		day: Date | string | number,
		groupIndex: number,
		groupSize: number
	) => {
		const startDate = parseDate(event.startedAt)
		const dayStart = startOfDay(parseDate(day))
		const eventStart = startDate < dayStart ? dayStart : startDate
		const startMinutes = differenceInMinutes(eventStart, dayStart)

		const top = (startMinutes / 1440) * 100
		const width = 100 / groupSize
		const left = groupIndex * width

		return { top: `${top}%`, width: `${width}%`, left: `${left}%` }
	}

	const getEventsForWeek = (events: Schedule[], weekDate: Date | string | number): Schedule[] => {
		const date = parseDate(weekDate)
		const weekStart = startOfWeek(date, WEEK_OPTIONS)
		const weekEnd = endOfWeek(date, WEEK_OPTIONS)

		return getEventsForDateRange(events, weekStart, weekEnd)
	}

	const getEventsForMonth = (events: Schedule[], monthDate: Date | string | number): Schedule[] => {
		const date = parseDate(monthDate)
		const monthStart = startOfMonth(date)
		const monthEnd = endOfMonth(date)

		return getEventsForDateRange(events, monthStart, monthEnd)
	}

	const groupEventsByDate = (events: Schedule[]): Record<string, Schedule[]> => {
		const grouped: Record<string, Schedule[]> = {}

		for (const event of events) {
			const eventDate = parseDate(event.startedAt)
			const dateKey = startOfDay(eventDate).toISOString()

			if (!grouped[dateKey]) {
				grouped[dateKey] = []
			}
			grouped[dateKey].push(event)
		}

		Object.values(grouped).forEach((dayEvents) => {
			dayEvents.sort((a, b) => {
				const startA = parseDate(a.startedAt).getTime()
				const startB = parseDate(b.startedAt).getTime()
				return startA - startB
			})
		})

		return grouped
	}

	return {
		parseDate,
		groupEvents,
		groupEventsBySameTime,
		getEventsForDate,
		getEventsForDateRange,
		getEventsForWeek,
		getEventsForMonth,
		groupEventsByDate,
		calculateEventPositions,
		getEventBlockStyle,
	}
}
