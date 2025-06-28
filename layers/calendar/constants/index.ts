export const WEEK_VIEW_ROW_HEIGHT = 63

export const WEEK_OPTIONS = { weekStartsOn: 1 as const }

export const EVENT_TYPE_COLORS: Record<TEventType, string> = {
	Лб: "bg-event-lab",
	Лк: "bg-event-lecture",
	Пз: "bg-event-practise",
	Зал: "bg-event-credit",
	Екз: "bg-event-exam",
	Конс: "bg-event-consultation",
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
] as const

export const VIEW_CONFIGS: Record<string, { format: string; capitalize: boolean }> = {
	year: { format: "yyyy рік", capitalize: false },
	month: { format: "LLLL yyyy", capitalize: true },
	day: { format: "d MMMM yyyy", capitalize: true },
	default: { format: "LLLL yyyy", capitalize: true },
}

export const DEFAULT_CALENDAR_SETTINGS = {
	view: "month" as TCalendarView,
}

export const MAX_VISIBLE_EVENTS_PER_DAY = 2
export const MAX_EVENT_POSITIONS = 3
