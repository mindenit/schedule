import type { Schedule } from "nurekit"
import { format } from "date-fns"

export interface IcsExportOptions {
	academicYearStart?: Date
	includedEventTypes?: string[]
	includeDescription?: boolean
}

export const useIcsExport = () => {
	const formatDateTime = (timestamp: number): string => {
		return format(new Date(timestamp * 1000), "yyyyMMdd'T'HHmmss")
	}

	const escapeIcsText = (text: string): string => {
		return text
			.replace(/\\/g, "\\\\")
			.replace(/;/g, "\\;")
			.replace(/,/g, "\\,")
			.replace(/\n/g, "\\n")
	}

	const getEventTypeUkrainian = (type: string): string => {
		const typeMap: Record<string, string> = {
			Лб: "Лабораторна робота",
			Лк: "Лекція",
			Пз: "Практичне заняття",
			Зал: "Залік",
			Екз: "Екзамен",
			Конс: "Консультація",
		}
		return typeMap[type] || type
	}

	const generateEventUid = (event: Schedule): string => {
		return `event-${event.id}-${event.startedAt}@schedule.app`
	}

	const createIcsEvent = (event: Schedule): string => {
		const startTime = formatDateTime(event.startedAt)
		const endTime = formatDateTime(event.endedAt)
		const eventType = getEventTypeUkrainian(event.type)
		const subject = escapeIcsText(event.subject.title)
		const teachers = event.teachers.map((t) => t.shortName).join(", ")
		const groups = event.groups.map((g) => g.name).join(", ")
		const location = event.auditorium?.name || ""

		let summary = `${eventType}: ${subject}`
		if (event.subject.brief) {
			summary += ` (${event.subject.brief})`
		}

		let description = `Тип заняття: ${eventType}\\n`
		description += `Предмет: ${subject}\\n`
		if (teachers) {
			description += `Викладач: ${teachers}\\n`
		}
		if (groups) {
			description += `Група: ${groups}\\n`
		}
		if (event.numberPair) {
			description += `Пара: ${event.numberPair}\\n`
		}

		return [
			"BEGIN:VEVENT",
			`UID:${generateEventUid(event)}`,
			`DTSTART:${startTime}`,
			`DTEND:${endTime}`,
			`SUMMARY:${escapeIcsText(summary)}`,
			`DESCRIPTION:${description}`,
			location ? `LOCATION:${escapeIcsText(location)}` : "",
			`CATEGORIES:${eventType}`,
			`STATUS:CONFIRMED`,
			`TRANSP:OPAQUE`,
			"END:VEVENT",
		]
			.filter(Boolean)
			.join("\r\n")
	}

	const getAcademicYearDates = (referenceDate: Date = new Date()) => {
		const currentYear = referenceDate.getFullYear()
		const currentMonth = referenceDate.getMonth()

		let academicStartYear: number
		if (currentMonth >= 8) {
			academicStartYear = currentYear
		} else {
			academicStartYear = currentYear - 1
		}

		const startDate = new Date(academicStartYear, 8, 1)
		const endDate = new Date(academicStartYear + 1, 7, 31, 23, 59, 59)

		return { startDate, endDate }
	}

	const createIcsCalendar = (events: Schedule[], options: IcsExportOptions = {}): string => {
		const { academicYearStart, includedEventTypes } = options

		let filteredEvents = events

		if (includedEventTypes && includedEventTypes.length > 0) {
			filteredEvents = events.filter((event) => includedEventTypes.includes(event.type))
		}

		const icsHeader = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Schedule App//Academic Schedule//UK",
			"CALSCALE:GREGORIAN",
			"METHOD:PUBLISH",
			`X-WR-CALNAME:Академічний розклад ${
				academicYearStart
					? `${academicYearStart.getFullYear()}-${academicYearStart.getFullYear() + 1}`
					: ""
			}`,
			"X-WR-CALDESC:Розклад занять на навчальний рік",
			"X-WR-TIMEZONE:Europe/Kiev",
		].join("\r\n")

		const icsFooter = "END:VCALENDAR"

		const icsEvents = filteredEvents.map((event) => createIcsEvent(event)).join("\r\n")

		return [icsHeader, icsEvents, icsFooter].join("\r\n")
	}

	const exportScheduleToIcs = (
		events: Schedule[],
		filename?: string,
		options: IcsExportOptions = {}
	) => {
		const { startDate } = getAcademicYearDates()
		const icsContent = createIcsCalendar(events, {
			academicYearStart: startDate,
			...options,
		})

		const defaultFilename = `schedule-${startDate.getFullYear()}-${startDate.getFullYear() + 1}.ics`

		const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url
		link.download = filename || defaultFilename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	const getAcademicYearTimestamps = (referenceDate: Date = new Date()) => {
		const { startDate, endDate } = getAcademicYearDates(referenceDate)
		return {
			startTimestamp: Math.floor(startDate.getTime() / 1000),
			endTimestamp: Math.floor(endDate.getTime() / 1000),
		}
	}

	return {
		exportScheduleToIcs,
		createIcsCalendar,
		getAcademicYearDates,
		getAcademicYearTimestamps,
		formatDateTime,
		escapeIcsText,
		getEventTypeUkrainian,
	}
}
