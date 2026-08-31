import type { MaybeRefOrGetter } from "vue"
import type { ScheduleFilters } from "~/types/schedule"
import { listOptions, metadataOptions, scheduleOptions } from "./_factories"

const teachersOptions = () => {
	const { $nurekit } = useNuxtApp()
	return listOptions("teachers", () => $nurekit.teachers.getAll())
}

const teacherScheduleOptions = (
	teacherId: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: ScheduleFilters = {}
) => {
	const { $nurekit } = useNuxtApp()
	return scheduleOptions("teacherSchedule", teacherId, startedAt, endedAt, filters, (args) =>
		$nurekit.teachers.getSchedule(args)
	)
}

const teacherAuditoriumsOptions = (teacherId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("teacherAuditoriums", teacherId, (id) =>
		$nurekit.teachers.getAuditoriums(id)
	)
}

const teacherGroupsOptions = (teacherId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("teacherGroups", teacherId, (id) => $nurekit.teachers.getGroups(id))
}

const teacherSubjectsOptions = (teacherId: MaybeRefOrGetter<number | string>) => {
	const { $nurekit } = useNuxtApp()
	return metadataOptions("teacherSubjects", teacherId, (id) => $nurekit.teachers.getSubjects(id))
}

export {
	teachersOptions,
	teacherScheduleOptions,
	teacherAuditoriumsOptions,
	teacherGroupsOptions,
	teacherSubjectsOptions,
}
