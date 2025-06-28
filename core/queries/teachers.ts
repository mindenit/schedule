import { queryOptions } from "@tanstack/vue-query"

const teachersOptions = () => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["teachers"],
		queryFn: () => $nurekit.teachers.findMany(),
	})
}

const teacherScheduleOptions = (startedAt: number | string, endedAt: number | string) => {
	const { $nurekit } = useNuxtApp()

	return queryOptions({
		queryKey: ["teacherSchedule", startedAt, endedAt],
		queryFn: () =>
			$nurekit.teachers.getSchedule({
				id: 10887098, // TODO: Use store for teacher ID
				startedAt: Number(startedAt),
				endedAt: Number(endedAt),
			}),
	})
}

export { teachersOptions, teacherScheduleOptions }
