import type { MaybeRefOrGetter } from "vue"
import type { ScheduleFilters } from "~/types/schedule"
import { listOptions, metadataOptions, scheduleOptions } from "./_factories"

const groupsOptions = () => {
	const { $nurekit } = useNuxtApp()
	return listOptions("groups", () => $nurekit.groups.getAll())
}

const groupScheduleOptions = (
	groupId: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: ScheduleFilters = {}
) => {
	const { $nurekit } = useNuxtApp()
	return scheduleOptions("groupSchedule", groupId, startedAt, endedAt, filters, (args) =>
		$nurekit.groups.getSchedule(args)
	)
}

const groupAuditoriumsOptions = (groupId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("groupAuditoriums", groupId, (id) => $nurekit.groups.getAuditoriums(id))
}

const groupTeachersOptions = (groupId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("groupTeachers", groupId, (id) => $nurekit.groups.getTeachers(id))
}

const groupSubjectsOptions = (groupId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("groupSubjects", groupId, (id) => $nurekit.groups.getSubjects(id))
}

export {
	groupsOptions,
	groupScheduleOptions,
	groupAuditoriumsOptions,
	groupTeachersOptions,
	groupSubjectsOptions,
}
