import { queryOptions } from "@tanstack/vue-query"
import type { MaybeRefOrGetter } from "vue"

const groupsOptions = () => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["groups"],
		queryFn: () => $nurekit.groups.findMany(),
	})
}

const groupScheduleOptions = (
	groupId: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: {
		auditoriums?: MaybeRefOrGetter<number[]>
		lessonTypes?: MaybeRefOrGetter<string[]>
		teachers?: MaybeRefOrGetter<number[]>
		subjects?: MaybeRefOrGetter<number[]>
	} = {}
) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["groupSchedule", groupId, startedAt, endedAt, filters],
		queryFn: async () => {
			const resolvedGroupId = toValue(groupId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			if (!resolvedGroupId || !resolvedStartedAt || !resolvedEndedAt) {
				return []
			}

			const resolvedFilters: Record<string, string | number[] | string[]> = {}

			const auditoriums = toValue(filters.auditoriums)
			if (auditoriums && auditoriums.length > 0) {
				resolvedFilters.auditoriums = auditoriums
			}

			const lessonTypes = toValue(filters.lessonTypes)
			if (lessonTypes && lessonTypes.length > 0) {
				resolvedFilters.lessonTypes = lessonTypes
			}

			const teachers = toValue(filters.teachers)
			if (teachers && teachers.length > 0) {
				resolvedFilters.teachers = teachers
			}

			const subjects = toValue(filters.subjects)
			if (subjects && subjects.length > 0) {
				resolvedFilters.subjects = subjects
			}

			return $nurekit.groups.getSchedule({
				id: Number(resolvedGroupId),
				startedAt: Number(resolvedStartedAt),
				endedAt: Number(resolvedEndedAt),
				...(Object.keys(resolvedFilters).length > 0 && { filters: resolvedFilters }),
			})
		},
		enabled: computed(() => {
			const resolvedGroupId = toValue(groupId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)
			return !!(resolvedGroupId && resolvedStartedAt && resolvedEndedAt)
		}),
	})
}

const groupAuditoruiumsOptions = (groupId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["groupAuditoriums", groupId],
		queryFn: async () => {
			const resolvedGroupId = toValue(groupId)
			if (!resolvedGroupId) {
				return []
			}
			return $nurekit.groups.getAuditoriums(Number(resolvedGroupId))
		},
		enabled: computed(() => !!toValue(groupId)),
	})
}

const groupTeachersOptions = (groupId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["groupTeachers", groupId],
		queryFn: async () => {
			const resolvedGroupId = toValue(groupId)
			if (!resolvedGroupId) {
				return []
			}
			return $nurekit.groups.getTeachers(Number(resolvedGroupId))
		},
		enabled: computed(() => !!toValue(groupId)),
	})
}

const groupSubjectsOptions = (groupId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["groupSubjects", groupId],
		queryFn: async () => {
			const resolvedGroupId = toValue(groupId)
			if (!resolvedGroupId) {
				return []
			}
			return $nurekit.groups.getSubjects(Number(resolvedGroupId))
		},
		enabled: computed(() => !!toValue(groupId)),
	})
}

export {
	groupsOptions,
	groupScheduleOptions,
	groupAuditoruiumsOptions,
	groupTeachersOptions,
	groupSubjectsOptions,
}
