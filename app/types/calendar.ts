import type { EventType } from "@mindenit/nurekit"

export type TCalendarView = "day" | "week" | "month" | "year"

export type TEventType = EventType

export interface ICalendarCell {
	day: number
	currentMonth: boolean
	date: Date
}
