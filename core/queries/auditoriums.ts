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
	endedAt: MaybeRefOrGetter<number | string>
) => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["auditorySchedule", auditoriumId, startedAt, endedAt],
		queryFn: async () => {
			const resolvedAuditoriumId = toValue(auditoriumId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			if (!resolvedAuditoriumId || !resolvedStartedAt || !resolvedEndedAt) {
				return []
			}

			return $nurekit.auditoriums.getSchedule({
				id: Number(resolvedAuditoriumId),
				startedAt: Number(resolvedStartedAt),
				endedAt: Number(resolvedEndedAt),
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

export { auditoriumsOptions, auditoriumScheduleOptions }
