import { format } from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"
import type { TEventType } from "~/types/calendar"
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "~/constants/calendar"

export const useEventFormatting = () => {
	const formatTime = (date: Date | string | number): string => {
		const parsedDate = parseDate(date)
		return format(parsedDate, "HH:mm")
	}

	const formatHour = (hour: number): string => {
		const date = new Date()
		date.setHours(hour, 0, 0, 0)
		return formatTime(date)
	}

	const formatTimeRange = (event: Schedule): string => {
		const start = parseDate(event.startedAt)
		const end = parseDate(event.endedAt)

		return `${formatTime(start)} - ${formatTime(end)}`
	}

	const formatDate = (
		date: Date | string | number,
		formatString: string = "d MMMM yyyy"
	): string => {
		const parsedDate = parseDate(date)
		return format(parsedDate, formatString, { locale: uk })
	}

	const getEventTypeColor = (type: string): string => {
		return EVENT_TYPE_COLORS[type as TEventType] || "bg-muted text-muted-foreground"
	}

	const getEventTypeLabel = (type: string): string => {
		return EVENT_TYPE_LABELS[type as TEventType] || type
	}

	const capitalize = (str: string): string => {
		if (!str) return ""
		return str.charAt(0).toUpperCase() + str.slice(1)
	}

	const getFirstLetters = (str: string): string => {
		if (!str) return ""
		const words = str.split(" ")
		if (words.length === 1 && words[0]) return words[0].charAt(0).toUpperCase()
		return `${words[0]?.charAt(0).toUpperCase() ?? ""}${words[1]?.charAt(0).toUpperCase() ?? ""}`
	}

	const formatDateTime = (
		date: Date | string | number,
		formatString: string = "d MMMM yyyy, HH:mm"
	): string => {
		const parsedDate = parseDate(date)
		return format(parsedDate, formatString, { locale: uk })
	}

	const toISOString = (date: Date | string | number): string => {
		const parsedDate = parseDate(date)
		return parsedDate.toISOString()
	}

	return {
		parseDate,
		formatTime,
		formatHour,
		formatTimeRange,
		formatDate,
		formatDateTime,
		getEventTypeColor,
		getEventTypeLabel,
		capitalize,
		getFirstLetters,
		toISOString,
	}
}
