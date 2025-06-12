import { format, parseISO, isValid } from "date-fns"
import { uk } from "date-fns/locale"

export const useEventFormatting = () => {
	const formatTime = (date: Date | string, use24HourFormat: boolean): string => {
		const parsedDate = typeof date === "string" ? parseISO(date) : date
		if (!isValid(parsedDate)) return ""
		return format(parsedDate, use24HourFormat ? "HH:mm" : "h:mm a")
	}

	const formatTimeRange = (event: ICalendarEvent, use24HourFormat: boolean): string => {
		const start = new Date(event.startDate)
		const end = new Date(event.endDate)
		return `${formatTime(start, use24HourFormat)} - ${formatTime(end, use24HourFormat)}`
	}

	const formatDate = (date: Date | string, formatString: string = "d MMMM yyyy"): string => {
		const parsedDate = typeof date === "string" ? parseISO(date) : date
		if (!isValid(parsedDate)) return ""
		return format(parsedDate, formatString, { locale: uk })
	}

	const getEventTypeColor = (type: TEventType): string => {
		return EVENT_TYPE_COLORS[type] || "bg-muted text-muted-foreground"
	}

	const getEventTypeLabel = (type: TEventType): string => {
		return EVENT_TYPE_LABELS[type] || type
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

	return {
		formatTime,
		formatTimeRange,
		formatDate,
		getEventTypeColor,
		getEventTypeLabel,
		capitalize,
		getFirstLetters,
	}
}
