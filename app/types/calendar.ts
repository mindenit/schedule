export type TCalendarView = "day" | "week" | "month" | "year"

export type TEventType = "Лб" | "Лк" | "Пз" | "Зал" | "Екз" | "Конс"

export interface ICalendarCell {
	day: number
	currentMonth: boolean
	date: Date
}
