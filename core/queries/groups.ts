import { queryOptions } from "@tanstack/vue-query"

const groupsOptions = () => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["groups"],
		queryFn: () => $nurekit.groups.findMany(),
	})
}

const groupScheduleOptions = (startedAt: number | string, endedAt: number | string) => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["groupSchedule", startedAt, endedAt],
		queryFn: () =>
			$nurekit.groups.getSchedule({
				id: 10887098, // TODO: Use store for group ID
				startedAt: Number(startedAt),
				endedAt: Number(endedAt),
			}),
	})
}

export { groupsOptions, groupScheduleOptions }
