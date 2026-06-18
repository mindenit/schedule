import {
	addDays,
	addMonths,
	addWeeks,
	subDays,
	subMonths,
	subWeeks,
	isSameWeek,
	isSameDay,
	isSameMonth,
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	isValid,
} from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"
import type { TCalendarView } from "~/types/calendar"
import { WEEK_OPTIONS } from "~/constants/calendar"

const FORMAT_STRING = "MMM d, yyyy"

type DateOperation = (date: Date, amount: number) => Date

const NEXT_OPERATIONS: Record<TCalendarView, DateOperation> = {
	month: addMonths,
	week: addWeeks,
	day: addDays,
}

const PREV_OPERATIONS: Record<TCalendarView, DateOperation> = {
	month: subMonths,
	week: subWeeks,
	day: subDays,
}

const COMPARE_FUNCTIONS: Record<TCalendarView, (d1: Date, d2: Date) => boolean> = {
	day: isSameDay,
	week: (d1, d2) => isSameWeek(d1, d2, WEEK_OPTIONS),
	month: isSameMonth,
}

export const parseDate = (date: Date | string | number | null | undefined): Date => {
	if (!date) return new Date()

	let parsedDate: Date

	if (date instanceof Date) {
		parsedDate = date
	} else if (typeof date === "number") {
		parsedDate = new Date(date * 1000)
	} else if (typeof date === "string") {
		parsedDate = new Date(date)
	} else {
		return new Date()
	}

	return isValid(parsedDate) ? parsedDate : new Date()
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
	const operations = direction === "next" ? NEXT_OPERATIONS : PREV_OPERATIONS
	const operation = operations[view]

	if (!operation) {
		throw new Error(`Unsupported view for navigation: ${view}`)
	}

	return operation(parsedDate, 1)
}

export function getEventsCount(
	events: Schedule[],
	date: Date | string | number,
	view: TCalendarView
): number {
	if (!events.length) return 0

	const parsedDate = parseDate(date)
	const compareFn = COMPARE_FUNCTIONS[view]

	if (!compareFn) {
		throw new Error(`Unsupported view for events count: ${view}`)
	}

	let count = 0
	for (let i = 0; i < events.length; i++) {
		try {
			const eventDate = parseDate(events[i]!.startedAt)
			if (compareFn(eventDate, parsedDate)) {
				count++
			}
		} catch {
			console.warn(`Invalid date in event ${events[i]!.id}:`, events[i]!.startedAt)
		}
	}

	return count
}
