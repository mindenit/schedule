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
	endedAt: MaybeRefOrGetter<number | string>
) => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["teacherSchedule", teacherId, startedAt, endedAt],
		queryFn: async () => {
			const resolvedTeacherId = toValue(teacherId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			if (!resolvedTeacherId || !resolvedStartedAt || !resolvedEndedAt) {
				return []
			}

			return $nurekit.teachers.getSchedule({
				id: Number(resolvedTeacherId),
				startedAt: Number(resolvedStartedAt),
				endedAt: Number(resolvedEndedAt),
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

export { teachersOptions, teacherScheduleOptions }
