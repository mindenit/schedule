import type { Schedule } from "nurekit"
import { formatInTimeZone } from "date-fns-tz"
import { storeToRefs } from "pinia"
import { downloadFile } from "~/utils/download"
import { EVENT_TYPE_LABELS } from "~/constants/calendar"
import { resolveTimezone } from "~/constants/timezones"
import { useSettingsStore } from "~/stores/settings"

export interface IcsExportOptions {
	academicYearStart?: Date
	includedEventTypes?: string[]
	includeDescription?: boolean
}

export const useIcsExport = () => {
	const { timezone } = storeToRefs(useSettingsStore())
	const effectiveTimezone = computed(() => resolveTimezone(timezone.value))

	/**
	 * Format a Unix seconds timestamp as an ICS datetime string.
	 * Always outputs floating local time in the selected timezone,
	 * paired with TZID on DTSTART/DTEND.
	 */
	const formatDateTime = (timestamp: number, tz: string): string => {
		return formatInTimeZone(new Date(timestamp * 1000), tz, "yyyyMMdd'T'HHmmss")
	}

	/**
	 * Build a minimal RFC 5545 VTIMEZONE block for the given IANA timezone.
	 *
	 * For Europe/Kyiv we include the historical DAYLIGHT block so pre-2022
	 * events in old exports remain correct (Ukraine dropped DST in 2022).
	 *
	 * For all other zones we emit a simplified STANDARD-only block using the
	 * current UTC offset. This is not perfectly DST-aware for arbitrary zones,
	 * but it is sufficient for calendar apps that resolve events by TZID via
	 * their own IANA database — the VTIMEZONE block is advisory.
	 */
	const buildVtimezone = (tz: string): string => {
		if (tz === "Europe/Kyiv" || tz === "Europe/Kiev") {
			return [
				"BEGIN:VTIMEZONE",
				"TZID:Europe/Kyiv",
				"BEGIN:STANDARD",
				"DTSTART:19701025T040000",
				"TZNAME:EET",
				"TZOFFSETFROM:+0300",
				"TZOFFSETTO:+0200",
				"RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
				"END:STANDARD",
				"BEGIN:DAYLIGHT",
				"DTSTART:19700329T030000",
				"TZNAME:EEST",
				"TZOFFSETFROM:+0200",
				"TZOFFSETTO:+0300",
				"RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
				"END:DAYLIGHT",
				"END:VTIMEZONE",
			].join("\r\n")
		}

		// Generic block: derive the current UTC offset for this timezone.
		// Calendar apps that recognise the TZID will use their own IANA data.
		const nowUtcMs = Date.now()
		const localStr = new Intl.DateTimeFormat("en", {
			timeZone: tz,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZoneName: "shortOffset",
		}).format(nowUtcMs)

		// Extract offset from something like "03:00 GMT+3" → "+0300"
		const offsetMatch = localStr.match(/GMT([+-]\d+)(?::(\d+))?/)
		let offsetStr = "+0000"
		if (offsetMatch) {
			const hours = parseInt(offsetMatch[1] ?? "0", 10)
			const minutes = parseInt(offsetMatch[2] ?? "0", 10)
			const sign = hours >= 0 ? "+" : "-"
			offsetStr = `${sign}${String(Math.abs(hours)).padStart(2, "0")}${String(minutes).padStart(2, "0")}`
		}

		// Sanitise the TZID for use inside the ICS block (no special chars)
		const safeTzName = tz.replace(/[^A-Za-z0-9/_+-]/g, "_")

		return [
			"BEGIN:VTIMEZONE",
			`TZID:${safeTzName}`,
			"BEGIN:STANDARD",
			"DTSTART:19700101T000000",
			`TZOFFSETFROM:${offsetStr}`,
			`TZOFFSETTO:${offsetStr}`,
			`TZNAME:${safeTzName}`,
			"END:STANDARD",
			"END:VTIMEZONE",
		].join("\r\n")
	}

	const escapeIcsText = (text: string): string => {
		return text
			.replace(/\\/g, "\\\\")
			.replace(/;/g, "\\;")
			.replace(/,/g, "\\,")
			.replace(/\n/g, "\\n")
	}

	const getEventTypeUkrainian = (type: string): string =>
		EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS] || type

	const generateEventUid = (event: Schedule): string => {
		return `event-${event.id}-${event.startedAt}@schedule.app`
	}

	const createIcsEvent = (event: Schedule, tz: string): string => {
		const startTime = formatDateTime(event.startedAt, tz)
		const endTime = formatDateTime(event.endedAt, tz)
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

		// Normalise TZID to match what buildVtimezone declares
		const tzId = tz === "Europe/Kiev" ? "Europe/Kyiv" : tz.replace(/[^A-Za-z0-9/_+-]/g, "_")

		return [
			"BEGIN:VEVENT",
			`UID:${generateEventUid(event)}`,
			`DTSTART;TZID=${tzId}:${startTime}`,
			`DTEND;TZID=${tzId}:${endTime}`,
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
		const tz = effectiveTimezone.value

		let filteredEvents = events

		if (includedEventTypes && includedEventTypes.length > 0) {
			filteredEvents = events.filter((event) => includedEventTypes.includes(event.type))
		}

		const tzId = tz === "Europe/Kiev" ? "Europe/Kyiv" : tz.replace(/[^A-Za-z0-9/_+-]/g, "_")

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
			`X-WR-TIMEZONE:${tzId}`,
		].join("\r\n")

		const icsFooter = "END:VCALENDAR"

		const vtimezone = buildVtimezone(tz)
		const icsEvents = filteredEvents.map((event) => createIcsEvent(event, tz)).join("\r\n")

		return [icsHeader, vtimezone, icsEvents, icsFooter].join("\r\n")
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
		downloadFile(blob, filename || defaultFilename)
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
		getAcademicYearTimestamps,
	}
}
