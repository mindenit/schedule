export const WEEK_VIEW_ROW_HEIGHT = 63

export const WEEK_OPTIONS = { weekStartsOn: 1 as const }

export const EVENT_TYPE_COLORS: Record<TEventType, string> = {
	practise: "bg-event-practise",
	lecture: "bg-event-lecture",
	lab: "bg-event-lab",
	consultation: "bg-event-consultation",
	exam: "bg-event-exam",
	credit: "bg-event-credit",
}

export const EVENT_TYPE_LABELS: Record<TEventType, string> = {
	practise: "Практичне заняття",
	lecture: "Лекція",
	lab: "Лабораторна робота",
	consultation: "Консультація",
	exam: "Екзамен",
	credit: "Залік",
}

export const VIEW_OPTIONS = [
	{ value: "day", label: "День" },
	{ value: "week", label: "Тиждень" },
	{ value: "month", label: "Місяць" },
] as const

export const VIEW_CONFIGS: Record<string, { format: string; capitalize: boolean }> = {
	year: { format: "yyyy рік", capitalize: false },
	month: { format: "LLLL yyyy", capitalize: true },
	day: { format: "d MMMM yyyy", capitalize: true },
	default: { format: "LLLL yyyy", capitalize: true },
}

export const DEFAULT_CALENDAR_SETTINGS = {
	view: "month" as const,
	use24HourFormat: true,
}

export const MAX_VISIBLE_EVENTS_PER_DAY = 2
export const MAX_EVENT_POSITIONS = 3
