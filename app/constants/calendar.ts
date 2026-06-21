import type { TEventType } from "~/types/calendar"

export const CALENDAR_START_HOUR = 7
export const CALENDAR_END_HOUR = 19
export const CALENDAR_HOURS = Array.from(
	{ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
	(_, i) => i + CALENDAR_START_HOUR
)

export const WEEK_OPTIONS = { weekStartsOn: 1 as const }

export const EVENT_TYPE_COLORS: Record<TEventType, string> = {
	Лб: "bg-event-lab",
	Лк: "bg-event-lecture",
	Пз: "bg-event-practise",
	Зал: "bg-event-credit",
	Екз: "bg-event-exam",
	Конс: "bg-event-consultation",
}

export const EVENT_TYPE_BORDERS: Record<TEventType, string> = {
	Лб: "border-event-lab",
	Лк: "border-event-lecture",
	Пз: "border-event-practise",
	Зал: "border-event-credit",
	Екз: "border-event-exam",
	Конс: "border-event-consultation",
}

export const EVENT_TYPE_LABELS: Record<TEventType, string> = {
	Лб: "Лабораторна робота",
	Лк: "Лекція",
	Пз: "Практичне заняття",
	Зал: "Залік",
	Екз: "Екзамен",
	Конс: "Консультація",
}

export const VIEW_OPTIONS = [
	{ value: "day", label: "День" },
	{ value: "week", label: "Тиждень" },
	{ value: "month", label: "Місяць" },
	{ value: "year", label: "Рік" },
] as const

export const VIEW_CONFIGS: Record<string, { format: string; capitalize: boolean }> = {
	year: { format: "yyyy рік", capitalize: false },
	month: { format: "LLLL yyyy", capitalize: true },
	day: { format: "d MMMM yyyy", capitalize: true },
	default: { format: "LLLL yyyy", capitalize: true },
}

// ISO date string used for URL query params (?date=) and other machine-readable contexts.
// Use VIEW_CONFIGS format strings for display purposes.
export const DATE_FORMAT_ISO = "yyyy-MM-dd"

export const MAX_VISIBLE_EVENTS_PER_DAY = 2
export const MAX_EVENT_POSITIONS = 3

// TanStack Query stale times.
// Schedule data changes rarely — once fetched, treat as fresh for the given duration.
export const STALE_TIME_SCHEDULE = 1000 * 60 * 60 // 1 hour — full academic year schedule
export const STALE_TIME_METADATA = 1000 * 60 * 60 * 6 // 6 hours — teachers/auditoriums/subjects lists
export const STALE_TIME_ENTITY_LIST = 1000 * 60 * 60 * 24 // 24 hours — all groups / all teachers
