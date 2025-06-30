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
	endedAt: MaybeRefOrGetter<number | string>
) => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["groupSchedule", groupId, startedAt, endedAt],
		queryFn: async () => {
			const resolvedGroupId = toValue(groupId)
			const resolvedStartedAt = toValue(startedAt)
			const resolvedEndedAt = toValue(endedAt)

			if (!resolvedGroupId || !resolvedStartedAt || !resolvedEndedAt) {
				return []
			}

			return $nurekit.groups.getSchedule({
				id: Number(resolvedGroupId),
				startedAt: Number(resolvedStartedAt),
				endedAt: Number(resolvedEndedAt),
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

export { groupsOptions, groupScheduleOptions }
