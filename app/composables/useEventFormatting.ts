import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"
import type { TEventType } from "~/types/calendar"
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "~/constants/calendar"

export const useEventFormatting = () => {
	const { tzFormat } = useTimezone()

	const formatTime = (date: Date | string | number): string => {
		return tzFormat(date, "HH:mm")
	}

	const formatHour = (hour: number): string => {
		return `${String(hour).padStart(2, "0")}:00`
	}

	const formatTimeRange = (event: Schedule): string => {
		return `${formatTime(event.startedAt)} - ${formatTime(event.endedAt)}`
	}

	const formatDate = (
		date: Date | string | number,
		formatString: string = "d MMMM yyyy"
	): string => {
		return tzFormat(date, formatString, { locale: uk })
	}

	const getEventTypeColor = (type: string): string => {
		return EVENT_TYPE_COLORS[type as TEventType] || "bg-muted text-muted-foreground"
	}

	const getEventTypeLabel = (type: string): string => {
		return EVENT_TYPE_LABELS[type as TEventType] || type
	}

	const formatDateTime = (
		date: Date | string | number,
		formatString: string = "d MMMM yyyy, HH:mm"
	): string => {
		return tzFormat(date, formatString, { locale: uk })
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
		toISOString,
	}
}
