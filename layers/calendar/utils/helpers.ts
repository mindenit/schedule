import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	subDays,
	subMonths,
	subWeeks,
	subYears,
	isSameWeek,
	isSameDay,
	isSameMonth,
	isSameYear,
	startOfWeek,
	startOfMonth,
	startOfYear,
	endOfMonth,
	endOfWeek,
	endOfYear,
	format,
	parseISO,
	differenceInMinutes,
	eachDayOfInterval,
	startOfDay,
	differenceInDays,
	isValid,
} from "date-fns"
import { uk } from "date-fns/locale"
import type { TCalendarView, ICalendarCell, ICalendarEvent } from "../types"

const FORMAT_STRING = "MMM d, yyyy"

export function rangeText(view: TCalendarView, date: Date): string {
	let start: Date
	let end: Date

	switch (view) {
		case "month":
			start = startOfMonth(date)
			end = endOfMonth(date)
			break
		case "week":
			start = startOfWeek(date)
			end = endOfWeek(date)
			break
		case "day":
			return format(date, FORMAT_STRING, { locale: uk })
		case "year":
			start = startOfYear(date)
			end = endOfYear(date)
			break
		case "agenda":
			start = startOfMonth(date)
			end = endOfMonth(date)
			break
		default:
			return "Помилка при форматуванні"
	}

	const formattedStart = format(start, FORMAT_STRING, { locale: uk })
	const formattedEnd = format(end, FORMAT_STRING, { locale: uk })

	return `${formattedStart} - ${formattedEnd}`
}

export function navigateDate(
	date: Date,
	view: TCalendarView,
	direction: "previous" | "next"
): Date {
	const operations = {
		month: direction === "next" ? addMonths : subMonths,
		week: direction === "next" ? addWeeks : subWeeks,
		day: direction === "next" ? addDays : subDays,
		year: direction === "next" ? addYears : subYears,
		agenda: direction === "next" ? addMonths : subMonths,
	}

	return operations[view](date, 1)
}

export function getEventsCount(events: ICalendarEvent[], date: Date, view: TCalendarView): number {
	const compareFns: Record<TCalendarView, (d1: Date, d2: Date) => boolean> = {
		day: isSameDay,
		week: isSameWeek,
		month: isSameMonth,
		year: isSameYear,
		agenda: isSameMonth,
	}

	const compareFn = compareFns[view]
	return events.filter((event) => compareFn(parseISO(event.startDate), date)).length
}

export function groupEvents(dayEvents: ICalendarEvent[]): ICalendarEvent[][] {
	const sortedEvents = [...dayEvents].sort(
		(a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
	)
	const groups: ICalendarEvent[][] = []

	for (const event of sortedEvents) {
		const eventStart = parseISO(event.startDate)
		let placed = false

		for (const group of groups) {
			const lastEventInGroup = group[group.length - 1]
			if (!lastEventInGroup) continue
			const lastEventEnd = parseISO(lastEventInGroup.endDate)

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

export function getEventBlockStyle(
	event: ICalendarEvent,
	day: Date,
	groupIndex: number,
	groupSize: number
) {
	const startDate = parseISO(event.startDate)
	const dayStart = startOfDay(day)
	const eventStart = startDate < dayStart ? dayStart : startDate
	const startMinutes = differenceInMinutes(eventStart, dayStart)

	const top = (startMinutes / 1440) * 100
	const width = 100 / groupSize
	const left = groupIndex * width

	return { top: `${top}%`, width: `${width}%`, left: `${left}%` }
}

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
	const year = selectedDate.getFullYear()
	const month = selectedDate.getMonth()

	const daysInMonth = endOfMonth(selectedDate).getDate()
	const firstDayOfMonth = startOfMonth(selectedDate).getDay()
	const daysInPrevMonth = endOfMonth(new Date(year, month - 1)).getDate()

	const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
		const day = daysInPrevMonth - firstDayOfMonth + i + 1
		return {
			day,
			currentMonth: false,
			date: new Date(year, month - 1, day),
		}
	})

	const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
		day: i + 1,
		currentMonth: true,
		date: new Date(year, month, i + 1),
	}))

	const totalDays = firstDayOfMonth + daysInMonth
	const nextMonthDays = Array.from({ length: (7 - (totalDays % 7)) % 7 }, (_, i) => ({
		day: i + 1,
		currentMonth: false,
		date: new Date(year, month + 1, i + 1),
	}))

	return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
}

export function calculateMonthEventPositions(
	multiDayEvents: ICalendarEvent[],
	singleDayEvents: ICalendarEvent[],
	selectedDate: Date
): Record<string, number> {
	const monthStart = startOfMonth(selectedDate)
	const monthEnd = endOfMonth(selectedDate)
	const eventPositions: Record<string, number> = {}
	const occupiedPositions: Record<string, boolean[]> = {}

	eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
		occupiedPositions[day.toISOString()] = [false, false, false]
	})

	const sortedEvents = [
		...[...multiDayEvents].sort((a, b) => {
			const aDuration = differenceInDays(parseISO(a.endDate), parseISO(a.startDate))
			const bDuration = differenceInDays(parseISO(b.endDate), parseISO(b.startDate))
			return (
				bDuration - aDuration || parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
			)
		}),
		...[...singleDayEvents].sort(
			(a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
		),
	]

	sortedEvents.forEach((event) => {
		const eventStart = parseISO(event.startDate)
		const eventEnd = parseISO(event.endDate)
		const eventDays = eachDayOfInterval({
			start: eventStart < monthStart ? monthStart : eventStart,
			end: eventEnd > monthEnd ? monthEnd : eventEnd,
		})

		let position = -1
		for (let i = 0; i < 3; i++) {
			if (
				eventDays.every((day) => {
					const dayPositions = occupiedPositions[startOfDay(day).toISOString()]
					return dayPositions && !dayPositions[i]
				})
			) {
				position = i
				break
			}
		}

		if (position !== -1) {
			eventDays.forEach((day) => {
				const dayKey = startOfDay(day).toISOString()
				if (occupiedPositions[dayKey]) {
					occupiedPositions[dayKey][position] = true
				}
			})
			eventPositions[String(event.id)] = position
		}
	})

	return eventPositions
}

export function getMonthCellEvents(
	date: Date,
	events: ICalendarEvent[],
	eventPositions: Record<string, number>
) {
	const dayStart = startOfDay(date)
	const eventsForDate = events.filter((event) => {
		const eventStart = startOfDay(parseISO(event.startDate))
		const eventEnd = startOfDay(parseISO(event.endDate))
		return dayStart >= eventStart && dayStart <= eventEnd
	})

	return eventsForDate
		.map((event) => ({
			...event,
			position: eventPositions[String(event.id)] ?? -1,
			isMultiDay: !isSameDay(parseISO(event.startDate), parseISO(event.endDate)),
		}))
		.sort((a, b) => {
			if (a.isMultiDay && !b.isMultiDay) return -1
			if (!a.isMultiDay && b.isMultiDay) return 1
			return a.position - b.position
		})
}

export function formatTime(date: Date | string, use24HourFormat: boolean): string {
	const parsedDate = typeof date === "string" ? parseISO(date) : date
	if (!isValid(parsedDate)) return ""
	return format(parsedDate, use24HourFormat ? "HH:mm" : "h:mm a")
}

export const getFirstLetters = (str: string): string => {
	if (!str) return ""
	const words = str.split(" ")
	if (words.length === 1 && words[0]) return words[0].charAt(0).toUpperCase()
	return `${words[0]?.charAt(0).toUpperCase() ?? ""}${words[1]?.charAt(0).toUpperCase() ?? ""}`
}

export const toCapitalize = (str: string): string => {
	if (!str) return ""
	return str.charAt(0).toUpperCase() + str.slice(1)
}
