import { format, isValid } from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"

export const useEventFormatting = () => {
	const parseDate = (date: Date | string | number): Date | null => {
		let parsedDate: Date

		if (date instanceof Date) {
			parsedDate = date
		} else if (typeof date === "number") {
			parsedDate = new Date(date * 1000)
		} else if (typeof date === "string") {
			parsedDate = new Date(date)
		} else {
			return null
		}

		return isValid(parsedDate) ? parsedDate : null
	}

	const formatTime = (date: Date | string | number): string => {
		const parsedDate = parseDate(date)
		if (!parsedDate) return ""

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

		if (!start || !end) return ""

		return `${formatTime(start)} - ${formatTime(end)}`
	}

	const formatDate = (
		date: Date | string | number,
		formatString: string = "d MMMM yyyy"
	): string => {
		const parsedDate = parseDate(date)
		if (!parsedDate) return ""

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
		if (!parsedDate) return ""

		return format(parsedDate, formatString, { locale: uk })
	}

	const formatRelativeTime = (date: Date | string | number): string => {
		const parsedDate = parseDate(date)
		if (!parsedDate) return ""

		const now = new Date()
		const diffInMinutes = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60))

		if (diffInMinutes < 1) return "щойно"
		if (diffInMinutes < 60) return `${diffInMinutes} хв тому`

		const diffInHours = Math.floor(diffInMinutes / 60)
		if (diffInHours < 24) return `${diffInHours} год тому`

		const diffInDays = Math.floor(diffInHours / 24)
		if (diffInDays < 7) return `${diffInDays} дн тому`

		return formatDate(parsedDate)
	}

	const toTimestamp = (date: Date | string | number): number => {
		const parsedDate = parseDate(date)
		return parsedDate ? parsedDate.getTime() : 0
	}

	const toISOString = (date: Date | string | number): string => {
		const parsedDate = parseDate(date)
		return parsedDate ? parsedDate.toISOString() : ""
	}

	return {
		parseDate,
		formatTime,
		formatHour,
		formatTimeRange,
		formatDate,
		formatDateTime,
		formatRelativeTime,
		getEventTypeColor,
		getEventTypeLabel,
		capitalize,
		getFirstLetters,
		toTimestamp,
		toISOString,
	}
}
