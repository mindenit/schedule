export type TCalendarView = "day" | "week" | "month" | "year" | "agenda"

export type TEventType = "practise" | "lecture" | "lab" | "consultation" | "exam" | "credit"

export interface ICalendarEvent {
	id: number
	startDate: string
	endDate: string
	title: string
	type: TEventType
}

export interface ICalendarCell {
	day: number
	currentMonth: boolean
	date: Date
}
