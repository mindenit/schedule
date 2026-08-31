import type { MaybeRefOrGetter } from "vue"

export interface GenericScheduleItem {
	id: number
	name: string
	type: ScheduleTabType
}

export type ScheduleTabType = "group" | "teacher" | "auditorium"

/** Shared filter shape for all entity schedule queries (groups, teachers, auditoriums). */
export type ScheduleFilters = {
	auditoriums?: MaybeRefOrGetter<number[]>
	lessonTypes?: MaybeRefOrGetter<string[]>
	teachers?: MaybeRefOrGetter<number[]>
	subjects?: MaybeRefOrGetter<number[]>
	groups?: MaybeRefOrGetter<number[]>
}
