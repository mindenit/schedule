import { queryOptions } from "@tanstack/vue-query"
import type { MaybeRefOrGetter } from "vue"
import {
	STALE_TIME_ENTITY_LIST,
	STALE_TIME_METADATA,
	STALE_TIME_SCHEDULE,
} from "~/constants/calendar"

const auditoriumsOptions = () => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditoriums"],
		queryFn: () => $nurekit.auditoriums.findMany(),
		staleTime: STALE_TIME_ENTITY_LIST,
	})
}

const auditoriumScheduleOptions = (
	auditoriumId: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: {
		lessonTypes?: MaybeRefOrGetter<string[]>
		teachers?: MaybeRefOrGetter<number[]>
		groups?: MaybeRefOrGetter<number[]>
		subjects?: MaybeRefOrGetter<number[]>
	} = {}
) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditorySchedule", auditoriumId, startedAt, endedAt, filters],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			if (!resolvedAuditoriumId || !resolvedStartedAt || !resolvedEndedAt) {
				return []
			}

			const resolvedFilters: Record<string, string | number[] | string[]> = {}

			const lessonTypes = toValue(filters.lessonTypes)
			if (lessonTypes && lessonTypes.length > 0) {
				resolvedFilters.lessonTypes = lessonTypes
			}

			const teachers = toValue(filters.teachers)
			if (teachers && teachers.length > 0) {
				resolvedFilters.teachers = teachers
			}

			const groups = toValue(filters.groups)
			if (groups && groups.length > 0) {
				resolvedFilters.groups = groups
			}

			const subjects = toValue(filters.subjects)
			if (subjects && subjects.length > 0) {
				resolvedFilters.subjects = subjects
			}

			return $nurekit.auditoriums.getSchedule({
				id: Number(resolvedAuditoriumId),
				startedAt: Number(resolvedStartedAt),
				endedAt: Number(resolvedEndedAt),
				...(Object.keys(resolvedFilters).length > 0 && { filters: resolvedFilters }),
			})
		},
		staleTime: STALE_TIME_SCHEDULE,
		enabled: () => !!(toValue(auditoriumId) && toValue(startedAt) && toValue(endedAt)),
	})
}

const auditoriumGroupsOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditoriumGroups", auditoriumId],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			if (!resolvedAuditoriumId) return []
			return $nurekit.auditoriums.getGroups(Number(resolvedAuditoriumId))
		},
		staleTime: STALE_TIME_METADATA,
		enabled: () => !!toValue(auditoriumId),
	})
}

const auditoriumTeachersOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditoriumTeachers", auditoriumId],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			if (!resolvedAuditoriumId) return []
			return $nurekit.auditoriums.getTeachers(Number(resolvedAuditoriumId))
		},
		staleTime: STALE_TIME_METADATA,
		enabled: () => !!toValue(auditoriumId),
	})
}

const auditoriumSubjectsOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditoriumSubjects", auditoriumId],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			if (!resolvedAuditoriumId) return []
			return $nurekit.auditoriums.getSubjects(Number(resolvedAuditoriumId))
		},
		staleTime: STALE_TIME_METADATA,
		enabled: () => !!toValue(auditoriumId),
	})
}

export {
	auditoriumsOptions,
	auditoriumScheduleOptions,
	auditoriumGroupsOptions,
	auditoriumTeachersOptions,
	auditoriumSubjectsOptions,
}
