import type { Schedule } from "nurekit"

export type TCalendarView = "day" | "week" | "month"

export type TEventType = "practise" | "lecture" | "lab" | "consultation" | "exam" | "credit"

export interface ICalendarEvent extends Omit<Schedule, "type"> {
	type: TEventType
}

export interface ICalendarCell {
	day: number
	currentMonth: boolean
	date: Date
}
