import type { MaybeRefOrGetter } from "vue"
import { listOptions, metadataOptions, scheduleOptions } from "./_factories"

type AuditoriumScheduleFilters = {
	lessonTypes?: MaybeRefOrGetter<string[]>
	teachers?: MaybeRefOrGetter<number[]>
	groups?: MaybeRefOrGetter<number[]>
	subjects?: MaybeRefOrGetter<number[]>
}

const auditoriumsOptions = () => {
	const { $nurekit } = useNuxtApp()
	return listOptions("auditoriums", () => $nurekit.auditoriums.findMany())
}

const auditoriumScheduleOptions = (
	auditoriumId: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: AuditoriumScheduleFilters = {}
) => {
	const { $nurekit } = useNuxtApp()
	return scheduleOptions(
		"auditoriumSchedule",
		auditoriumId,
		startedAt,
		endedAt,
		filters,
		(args) => $nurekit.auditoriums.getSchedule(args)
	)
}

const auditoriumGroupsOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("auditoriumGroups", auditoriumId, (id) =>
		$nurekit.auditoriums.getGroups(id)
	)
}

const auditoriumTeachersOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("auditoriumTeachers", auditoriumId, (id) =>
		$nurekit.auditoriums.getTeachers(id)
	)
}

const auditoriumSubjectsOptions = (auditoriumId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("auditoriumSubjects", auditoriumId, (id) =>
		$nurekit.auditoriums.getSubjects(id)
	)
}

export {
	auditoriumsOptions,
	auditoriumScheduleOptions,
	auditoriumGroupsOptions,
	auditoriumTeachersOptions,
	auditoriumSubjectsOptions,
}
