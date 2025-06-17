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
			start = startOfWeek(date, WEEK_OPTIONS)
			end = endOfWeek(date, WEEK_OPTIONS)
			break
		case "day":
			return format(date, FORMAT_STRING, { locale: uk })
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
		week: (d1, d2) => isSameWeek(d1, d2, WEEK_OPTIONS),
		month: isSameMonth,
	}

	const compareFn = compareFns[view]
	return events.filter((event) => compareFn(new Date(event.startedAt), date)).length
}
