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
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
} from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"

const FORMAT_STRING = "MMM d, yyyy"

const parseDate = (date: Date | string | number): Date => {
	if (date instanceof Date) return date
	if (typeof date === "number") return new Date(date * 1000)
	if (typeof date === "string") return new Date(date)
	return new Date()
}

export function rangeText(view: TCalendarView, date: Date | string | number): string {
	const parsedDate = parseDate(date)
	let start: Date
	let end: Date

	switch (view) {
		case "month":
			start = startOfMonth(parsedDate)
			end = endOfMonth(parsedDate)
			break
		case "week":
			start = startOfWeek(parsedDate, WEEK_OPTIONS)
			end = endOfWeek(parsedDate, WEEK_OPTIONS)
			break
		case "day":
			return format(parsedDate, FORMAT_STRING, { locale: uk })
		default:
			return "Помилка при форматуванні"
	}

	const formattedStart = format(start, FORMAT_STRING, { locale: uk })
	const formattedEnd = format(end, FORMAT_STRING, { locale: uk })

	return `${formattedStart} - ${formattedEnd}`
}

export function navigateDate(
	date: Date | string | number,
	view: TCalendarView,
	direction: "previous" | "next"
): Date {
	const parsedDate = parseDate(date)

	const operations = {
		month: direction === "next" ? addMonths : subMonths,
		week: direction === "next" ? addWeeks : subWeeks,
		day: direction === "next" ? addDays : subDays,
		year: direction === "next" ? addYears : subYears,
		agenda: direction === "next" ? addMonths : subMonths,
	}

	return operations[view](parsedDate, 1)
}

export function getEventsCount(
	events: Schedule[],
	date: Date | string | number,
	view: TCalendarView
): number {
	const parsedDate = parseDate(date)

	const compareFns: Record<TCalendarView, (d1: Date, d2: Date) => boolean> = {
		day: isSameDay,
		week: (d1, d2) => isSameWeek(d1, d2, WEEK_OPTIONS),
		month: isSameMonth,
	}

	const compareFn = compareFns[view] || isSameDay

	return events.filter((event) => {
		const eventDate = parseDate(event.startedAt)
		return compareFn(eventDate, parsedDate)
	}).length
}

export function isDateInRange(
	date: Date | string | number,
	startDate: Date | string | number,
	endDate: Date | string | number
): boolean {
	const parsedDate = parseDate(date)
	const start = parseDate(startDate)
	const end = parseDate(endDate)

	return parsedDate >= start && parsedDate <= end
}

export function getDateRangeForView(
	date: Date | string | number,
	view: TCalendarView
): { start: Date; end: Date } {
	const parsedDate = parseDate(date)

	switch (view) {
		case "month":
			return {
				start: startOfMonth(parsedDate),
				end: endOfMonth(parsedDate),
			}
		case "week":
			return {
				start: startOfWeek(parsedDate, WEEK_OPTIONS),
				end: endOfWeek(parsedDate, WEEK_OPTIONS),
			}
		case "day":
			return {
				start: parsedDate,
				end: parsedDate,
			}
		default:
			return {
				start: parsedDate,
				end: parsedDate,
			}
	}
}

export function getCalendarGridRange(
	date: Date | string | number,
	view: TCalendarView
): { start: Date; end: Date } {
	const parsedDate = parseDate(date)

	switch (view) {
		case "month": {
			const monthStart = startOfMonth(parsedDate)
			const monthEnd = endOfMonth(parsedDate)
			const calendarStart = startOfWeek(monthStart, WEEK_OPTIONS)
			const calendarEnd = endOfWeek(monthEnd, WEEK_OPTIONS)
			return { start: calendarStart, end: calendarEnd }
		}
		case "week": {
			return {
				start: startOfWeek(parsedDate, WEEK_OPTIONS),
				end: endOfWeek(parsedDate, WEEK_OPTIONS),
			}
		}
		case "day": {
			const dayStart = new Date(parsedDate)
			dayStart.setHours(0, 0, 0, 0)
			const dayEnd = new Date(parsedDate)
			dayEnd.setHours(23, 59, 59, 999)
			return { start: dayStart, end: dayEnd }
		}
		default:
			return {
				start: parsedDate,
				end: parsedDate,
			}
	}
}

export function formatDateRange(
	startDate: Date | string | number,
	endDate: Date | string | number,
	formatString: string = FORMAT_STRING
): string {
	const start = parseDate(startDate)
	const end = parseDate(endDate)

	const formattedStart = format(start, formatString, { locale: uk })
	const formattedEnd = format(end, formatString, { locale: uk })

	if (isSameDay(start, end)) {
		return formattedStart
	}

	return `${formattedStart} - ${formattedEnd}`
}

export function getEventsInDateRange(
	events: Schedule[],
	startDate: Date | string | number,
	endDate: Date | string | number
): Schedule[] {
	const start = parseDate(startDate)
	const end = parseDate(endDate)

	return events.filter((event) => {
		const eventStart = parseDate(event.startedAt)
		const eventEnd = parseDate(event.endedAt)

		return eventStart <= end && eventEnd >= start
	})
}
