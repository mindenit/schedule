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

/**
 * Parse a date value into a Date object.
 *
 * WARNING — number inputs are treated as Unix **seconds** (×1000 internally).
 * Do NOT pass `event.startedAt * 1000` here — that would double-multiply.
 * Pass `event.startedAt` directly, or construct `new Date(event.startedAt * 1000)` yourself
 * when you need milliseconds and will not pass through this function.
 */
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
		case "year":
			return format(parsedDate, "yyyy", { locale: uk })
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
	const step = direction === "next" ? 1 : -1

	switch (view) {
		case "day":
			return step > 0 ? addDays(parsedDate, 1) : subDays(parsedDate, 1)
		case "week":
			return step > 0 ? addWeeks(parsedDate, 1) : subWeeks(parsedDate, 1)
		case "month":
			return step > 0 ? addMonths(parsedDate, 1) : subMonths(parsedDate, 1)
		case "year":
			return step > 0 ? addYears(parsedDate, 1) : subYears(parsedDate, 1)
		default:
			throw new Error(`Unsupported view for navigation: ${view}`)
	}
}

export function getEventsCount(
	events: Schedule[],
	date: Date | string | number,
	view: TCalendarView
): number {
	if (!events.length) return 0

	const parsedDate = parseDate(date)

	const compareFn = (eventDate: Date): boolean => {
		switch (view) {
			case "day":
				return isSameDay(eventDate, parsedDate)
			case "week":
				return isSameWeek(eventDate, parsedDate, WEEK_OPTIONS)
			case "month":
				return isSameMonth(eventDate, parsedDate)
			case "year":
				return isSameYear(eventDate, parsedDate)
			default:
				throw new Error(`Unsupported view for events count: ${view}`)
		}
	}

	let count = 0
	for (let i = 0; i < events.length; i++) {
		try {
			// startedAt is Unix seconds — multiply by 1000 to get ms before passing to
			// the Date constructor. Do NOT pass through parseDate() which also multiplies.
			const eventDate = new Date(events[i]!.startedAt * 1000)
			if (compareFn(eventDate)) count++
		} catch {
			console.warn(`Invalid date in event ${events[i]!.id}:`, events[i]!.startedAt)
		}
	}

	return count
}
