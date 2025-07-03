export interface GenericScheduleItem {
	id: number
	name: string
	type: ScheduleTabType
}

export type ScheduleTabType = "group" | "teacher" | "auditorium"
