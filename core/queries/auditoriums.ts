import { queryOptions } from "@tanstack/vue-query"

const auditoriumsOptions = () => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["auditories"],
		queryFn: () => $nurekit.auditoriums.findMany(),
	})
}

const auditoriumScheduleOptions = (startedAt: number | string, endedAt: number | string) => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["auditorySchedule", startedAt, endedAt],
		queryFn: () =>
			$nurekit.auditoriums.getSchedule({
				id: 10887098, // TODO: Use store for auditorium ID
				startedAt: Number(startedAt),
				endedAt: Number(endedAt),
			}),
	})
}

export { auditoriumsOptions, auditoriumScheduleOptions }
