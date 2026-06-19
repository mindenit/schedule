import {
	isSameDay,
	startOfDay,
	differenceInMinutes,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
} from "date-fns"
import type { Schedule } from "nurekit"
import { WEEK_OPTIONS, CALENDAR_START_HOUR, CALENDAR_END_HOUR } from "~/constants/calendar"

// ---------------------------------------------------------------------------
// Pure helpers — module-level so no new closures are created per component
// instance call. Exported individually for direct import by call sites.
// ---------------------------------------------------------------------------

export function groupEvents(dayEvents: Schedule[]): Schedule[][] {
	// Pre-extract start timestamps once — avoids O(n log n) parseDate allocations in comparator
	const withMs = dayEvents.map((e) => ({ e, startMs: e.startedAt * 1000 }))
	withMs.sort((a, b) => a.startMs - b.startMs)

	const groups: Schedule[][] = []

	for (const { e: event } of withMs) {
		const eventStartMs = event.startedAt * 1000
		let placed = false

		for (const group of groups) {
			const last = group[group.length - 1]
			if (!last) continue
			if (eventStartMs >= last.endedAt * 1000) {
				group.push(event)
				placed = true
				break
			}
		}

		if (!placed) groups.push([event])
	}

	return groups
}

export function groupEventsBySameTime(events: Schedule[]): Schedule[][] {
	const timeGroups = new Map<string, Schedule[]>()

	for (const event of events) {
		// Use Unix ms directly — no Date allocation needed for the Map key
		const timeKey = `${event.startedAt * 1000}-${event.endedAt * 1000}`
		if (!timeGroups.has(timeKey)) timeGroups.set(timeKey, [])
		timeGroups.get(timeKey)!.push(event)
	}

	return Array.from(timeGroups.values()).sort((a, b) => a[0]!.startedAt - b[0]!.startedAt)
}

export function getEventsForDate(events: Schedule[], date: Date | string | number): Schedule[] {
	const targetDate = parseDate(date)
	return events.filter((event) => isSameDay(new Date(event.startedAt * 1000), targetDate))
}

export function getEventsForDateRange(
	events: Schedule[],
	startDate: Date | string | number,
	endDate: Date | string | number
): Schedule[] {
	const startMs = parseDate(startDate).getTime()
	const endMs = parseDate(endDate).getTime()

	return events.filter((event) => {
		return event.startedAt * 1000 <= endMs && event.endedAt * 1000 >= startMs
	})
}

export function getEventBlockStyle(
	event: Schedule,
	day: Date | string | number,
	groupIndex: number,
	groupSize: number
) {
	// Parse each input once at the top of the function
	const startDate = new Date(event.startedAt * 1000)
	const endDate = new Date(event.endedAt * 1000)
	const dayStart = startOfDay(parseDate(day))

	const calendarStart = new Date(dayStart)
	calendarStart.setHours(CALENDAR_START_HOUR, 0, 0, 0)

	const calendarEnd = new Date(dayStart)
	calendarEnd.setHours(CALENDAR_END_HOUR, 59, 59, 999)

	const eventStart = startDate < calendarStart ? calendarStart : startDate
	const eventEnd = endDate > calendarEnd ? calendarEnd : endDate

	if (startDate >= calendarEnd || endDate <= calendarStart) {
		return { top: "0%", height: "0%", width: "0%", left: "0%", display: "none" }
	}

	const totalCalendarMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1) * 60
	const startMinutes = differenceInMinutes(eventStart, calendarStart)
	const durationMinutes = differenceInMinutes(eventEnd, eventStart)

	const top = (startMinutes / totalCalendarMinutes) * 100
	const height = (durationMinutes / totalCalendarMinutes) * 100
	const width = 100 / groupSize
	const left = groupIndex * width

	return { top: `${top}%`, height: `${height}%`, width: `${width}%`, left: `${left}%` }
}

export function getEventsForWeek(events: Schedule[], weekDate: Date | string | number): Schedule[] {
	const date = parseDate(weekDate)
	const weekStart = startOfWeek(date, WEEK_OPTIONS)
	const weekEnd = endOfWeek(date, WEEK_OPTIONS)
	return getEventsForDateRange(events, weekStart, weekEnd)
}

export function getEventsForMonth(
	events: Schedule[],
	monthDate: Date | string | number
): Schedule[] {
	const date = parseDate(monthDate)
	const monthStart = startOfMonth(date)
	const monthEnd = endOfMonth(date)
	return getEventsForDateRange(events, monthStart, monthEnd)
}

export function groupEventsByDate(events: Schedule[]): Record<string, Schedule[]> {
	const grouped: Record<string, Schedule[]> = {}

	for (const event of events) {
		const dateKey = startOfDay(new Date(event.startedAt * 1000)).toISOString()
		if (!grouped[dateKey]) grouped[dateKey] = []
		grouped[dateKey].push(event)
	}

	// Pre-extract timestamps per group to avoid per-comparison allocations
	for (const dayEvents of Object.values(grouped)) {
		const withMs = dayEvents.map((e) => ({ e, startMs: e.startedAt * 1000 }))
		withMs.sort((a, b) => a.startMs - b.startMs)
		dayEvents.length = 0
		for (const { e } of withMs) dayEvents.push(e)
	}

	return grouped
}

// ---------------------------------------------------------------------------
// Composable wrapper — thin passthrough so existing callers using
// useEventGrouping() destructuring continue to work unchanged.
// New call sites should import the named functions directly.
// ---------------------------------------------------------------------------

export const useEventGrouping = () => ({
	parseDate,
	groupEvents,
	groupEventsBySameTime,
	getEventsForDate,
	getEventsForDateRange,
	getEventsForWeek,
	getEventsForMonth,
	groupEventsByDate,
	getEventBlockStyle,
})
