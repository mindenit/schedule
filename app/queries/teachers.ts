import type { MaybeRefOrGetter } from "vue"
import { listOptions, metadataOptions, scheduleOptions } from "./_factories"

type TeacherScheduleFilters = {
	lessonTypes?: MaybeRefOrGetter<string[]>
	groups?: MaybeRefOrGetter<number[]>
	auditoriums?: MaybeRefOrGetter<number[]>
	subjects?: MaybeRefOrGetter<number[]>
}

const teachersOptions = () => {
	const { $nurekit } = useNuxtApp()
	return listOptions("teachers", () => $nurekit.teachers.getAll())
}

const teacherScheduleOptions = (
	teacherId: MaybeRefOrGetter<number | string>,
	startedAt: MaybeRefOrGetter<number | string>,
	endedAt: MaybeRefOrGetter<number | string>,
	filters: TeacherScheduleFilters = {}
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
