import { queryOptions } from "@tanstack/vue-query"
import type { MaybeRefOrGetter } from "vue"

const teachersOptions = () => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["teachers"],
		queryFn: () => $nurekit.teachers.findMany(),
	})
}

const teacherScheduleOptions = (
	teacherId: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: {
		lessonTypes?: MaybeRefOrGetter<string[]>
		groups?: MaybeRefOrGetter<number[]>
		auditoriums?: MaybeRefOrGetter<number[]>
		subjects?: MaybeRefOrGetter<number[]>
	} = {}
) => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["teacherSchedule", teacherId, startedAt, endedAt, filters],
		queryFn: async () => {
			const resolvedTeacherId = toValue(teacherId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			if (!resolvedTeacherId || !resolvedStartedAt || !resolvedEndedAt) {
				return []
			}

			const resolvedFilters: Record<string, string | number[] | string[]> = {}

			const lessonTypes = toValue(filters.lessonTypes)
			if (lessonTypes && lessonTypes.length > 0) {
				resolvedFilters.lessonTypes = lessonTypes
			}

			const groups = toValue(filters.groups)
			if (groups && groups.length > 0) {
				resolvedFilters.groups = groups
			}

			const auditoriums = toValue(filters.auditoriums)
			if (auditoriums && auditoriums.length > 0) {
				resolvedFilters.auditoriums = auditoriums
			}

			const subjects = toValue(filters.subjects)
			if (subjects && subjects.length > 0) {
				resolvedFilters.subjects = subjects
			}

			return $nurekit.teachers.getSchedule({
				id: Number(resolvedTeacherId),
				startedAt: Number(resolvedStartedAt),
				endedAt: Number(resolvedEndedAt),
				...(Object.keys(resolvedFilters).length > 0 && { filters: resolvedFilters }),
			})
		},
		enabled: computed(() => {
			const resolvedTeacherId = toValue(teacherId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			return !!(resolvedTeacherId && resolvedStartedAt && resolvedEndedAt)
		}),
	})
}

const teacherAuditoriumsOptions = (teacherId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["teacherAuditoriums", teacherId],
		queryFn: async () => {
			const resolvedTeacherId = toValue(teacherId)
			if (!resolvedTeacherId) {
				return []
			}
			return $nurekit.teachers.getAuditoriums(Number(resolvedTeacherId))
		},
		enabled: computed(() => !!toValue(teacherId)),
	})
}

const teacherGroupsOptions = (teacherId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["teacherGroups", teacherId],
		queryFn: async () => {
			const resolvedTeacherId = toValue(teacherId)
			if (!resolvedTeacherId) {
				return []
			}
			return $nurekit.teachers.getGroups(Number(resolvedTeacherId))
		},
		enabled: computed(() => !!toValue(teacherId)),
	})
}

const teacherSubjectsOptions = (teacherId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return queryOptions({
		queryKey: ["teacherSubjects", teacherId],
		queryFn: async () => {
			const resolvedTeacherId = toValue(teacherId)
			if (!resolvedTeacherId) {
				return []
			}
			return $nurekit.teachers.getSubjects(Number(resolvedTeacherId))
		},
		enabled: computed(() => !!toValue(teacherId)),
	})
}

export {
	teachersOptions,
	teacherScheduleOptions,
	teacherAuditoriumsOptions,
	teacherGroupsOptions,
	teacherSubjectsOptions,
}
