import { queryOptions } from "@tanstack/vue-query"
import type { MaybeRefOrGetter } from "vue"

const auditoriumsOptions = () => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["auditories"],
		queryFn: () => $nurekit.auditoriums.findMany(),
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
		enabled: computed(() => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			return !!(resolvedAuditoriumId && resolvedStartedAt && resolvedEndedAt)
		}),
	})
}

const auditoriumGroupsOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditoriumGroups", auditoriumId],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			if (!resolvedAuditoriumId) {
				return []
			}
			return $nurekit.auditoriums.getGroups(Number(resolvedAuditoriumId))
		},
		enabled: computed(() => !!toValue(auditoriumId)),
	})
}

const auditoriumTeachersOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditoriumTeachers", auditoriumId],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			if (!resolvedAuditoriumId) {
				return []
			}
			return $nurekit.auditoriums.getTeachers(Number(resolvedAuditoriumId))
		},
		enabled: computed(() => !!toValue(auditoriumId)),
	})
}

const auditoriumSubjectsOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["auditoriumSubjects", auditoriumId],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			if (!resolvedAuditoriumId) {
				return []
			}
			return $nurekit.auditoriums.getSubjects(Number(resolvedAuditoriumId))
		},
		enabled: computed(() => !!toValue(auditoriumId)),
	})
}

export {
	auditoriumsOptions,
	auditoriumScheduleOptions,
	auditoriumGroupsOptions,
	auditoriumTeachersOptions,
	auditoriumSubjectsOptions,
}
