<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import {
	groupTeachersOptions,
	groupAuditoruiumsOptions,
	groupSubjectsOptions,
} from "~/core/queries/groups"
import {
	teacherGroupsOptions,
	teacherAuditoriumsOptions,
	teacherSubjectsOptions,
} from "~/core/queries/teachers"
import {
	auditoriumGroupsOptions,
	auditoriumTeachersOptions,
	auditoriumSubjectsOptions,
} from "~/core/queries/auditoriums"
import { FILTERS_LESSON_TYPES } from "../constants"

const props = defineProps<{ class?: string }>()

const filtersStore = useFiltersStore()
const scheduleStore = useScheduleStore()

const isOpen = ref(false)

const selectedSchedule = computed(() => scheduleStore.selectedSchedule)

const { data: teachers } = useQuery(
	computed(() => {
		if (selectedSchedule.value?.type === "group" && selectedSchedule.value?.id) {
			return groupTeachersOptions(selectedSchedule.value.id)
		}
		if (selectedSchedule.value?.type === "auditorium" && selectedSchedule.value?.id) {
			return auditoriumTeachersOptions(selectedSchedule.value.id)
		}
		return {
			queryKey: ["disabled-teachers"],
			queryFn: () => Promise.resolve([]),
			enabled: false,
		}
	})
)

const { data: auditoriums } = useQuery(
	computed(() =>
		selectedSchedule.value?.type === "group" && selectedSchedule.value?.id
			? groupAuditoruiumsOptions(selectedSchedule.value.id)
			: selectedSchedule.value?.type === "teacher" && selectedSchedule.value?.id
				? teacherAuditoriumsOptions(selectedSchedule.value.id)
				: {
						queryKey: ["disabled-auditoriums"],
						queryFn: () => Promise.resolve([]),
						enabled: false,
					}
	)
)

const { data: subjects } = useQuery(
	computed(() => {
		if (selectedSchedule.value?.type === "group" && selectedSchedule.value?.id) {
			return groupSubjectsOptions(selectedSchedule.value.id)
		}
		if (selectedSchedule.value?.type === "teacher" && selectedSchedule.value?.id) {
			return teacherSubjectsOptions(selectedSchedule.value.id)
		}
		if (selectedSchedule.value?.type === "auditorium" && selectedSchedule.value?.id) {
			return auditoriumSubjectsOptions(selectedSchedule.value.id)
		}
		return {
			queryKey: ["disabled-subjects"],
			queryFn: () => Promise.resolve([]),
			enabled: false,
		}
	})
)

const { data: groups } = useQuery(
	computed(() => {
		if (selectedSchedule.value?.type === "teacher" && selectedSchedule.value?.id) {
			return teacherGroupsOptions(selectedSchedule.value.id)
		}
		if (selectedSchedule.value?.type === "auditorium" && selectedSchedule.value?.id) {
			return auditoriumGroupsOptions(selectedSchedule.value.id)
		}
		return {
			queryKey: ["disabled-groups"],
			queryFn: () => Promise.resolve([]),
			enabled: false,
		}
	})
)

watch(isOpen, (open) => {
	if (open && selectedSchedule.value) {
		filtersStore.loadFilters(selectedSchedule.value.id, selectedSchedule.value.type)
	}
})
</script>

<template>
	<Dialog v-model:open="isOpen">
		<DialogTrigger as-child>
			<Button size="icon" :class="props.class">
				<Icon name="lucide:filter" class="!size-4" />
			</Button>
		</DialogTrigger>

		<DialogContent>
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2">
					<Icon name="lucide:filter" class="!size-5" />
					Фільтри
				</DialogTitle>
				<DialogDescription> Налаштуйте фільтри для відображення розкладу. </DialogDescription>
			</DialogHeader>

			<div
				v-if="!selectedSchedule"
				class="text-muted-foreground flex items-center justify-center py-8"
			>
				Оберіть розклад для налаштування фільтрів
			</div>

			<div
				v-else-if="!['group', 'teacher', 'auditorium'].includes(selectedSchedule.type)"
				class="text-muted-foreground flex items-center justify-center py-8"
			>
				Фільтри в розробці для цього типу розкладу
			</div>

			<div v-else class="max-h-96 space-y-6 overflow-y-auto">
				<div class="space-y-3">
					<h3 class="text-foreground text-sm font-semibold">Типи занять</h3>
					<div class="flex flex-wrap gap-2">
						<Button
							v-for="lessonType in FILTERS_LESSON_TYPES"
							:key="lessonType.id"
							:variant="filtersStore.isLessonTypeActive(lessonType.id) ? 'default' : 'outline'"
							size="sm"
							class="h-8 text-xs"
							@click="filtersStore.toggleLessonTypeFilter(lessonType.id)"
						>
							<Icon
								v-if="filtersStore.isLessonTypeActive(lessonType.id)"
								name="lucide:check"
								class="!size-4"
							/>
							{{ lessonType.name }}
						</Button>
					</div>
				</div>

				<div
					v-if="
						groups &&
						groups.length > 0 &&
						(selectedSchedule.type === 'teacher' || selectedSchedule.type === 'auditorium')
					"
					class="space-y-3"
				>
					<h3 class="text-foreground text-sm font-semibold">Групи</h3>
					<div class="flex flex-wrap gap-2">
						<Button
							v-for="group in groups"
							:key="group.id"
							:variant="filtersStore.isGroupActive(group.id) ? 'default' : 'outline'"
							size="sm"
							class="h-8 text-xs"
							@click="filtersStore.toggleGroupFilter(group.id)"
						>
							<Icon
								v-if="filtersStore.isGroupActive(group.id)"
								name="lucide:check"
								class="!size-4"
							/>
							{{ group.name }}
						</Button>
					</div>
				</div>

				<div
					v-if="
						teachers &&
						teachers.length > 0 &&
						(selectedSchedule.type === 'group' || selectedSchedule.type === 'auditorium')
					"
					class="space-y-3"
				>
					<h3 class="text-foreground text-sm font-semibold">Викладачі</h3>
					<div class="flex flex-wrap gap-2">
						<Button
							v-for="teacher in teachers"
							:key="teacher.id"
							:variant="filtersStore.isTeacherActive(teacher.id) ? 'default' : 'outline'"
							size="sm"
							class="h-8 text-xs"
							@click="filtersStore.toggleTeacherFilter(teacher.id)"
						>
							<Icon
								v-if="filtersStore.isTeacherActive(teacher.id)"
								name="lucide:check"
								class="!size-4"
							/>
							{{ teacher.shortName }}
						</Button>
					</div>
				</div>

				<div
					v-if="
						auditoriums &&
						auditoriums.length > 0 &&
						(selectedSchedule.type === 'group' || selectedSchedule.type === 'teacher')
					"
					class="space-y-3"
				>
					<h3 class="text-foreground text-sm font-semibold">Аудиторії</h3>
					<div class="flex flex-wrap gap-2">
						<Button
							v-for="auditorium in auditoriums"
							:key="auditorium.id"
							:variant="filtersStore.isAuditoriumActive(auditorium.id) ? 'default' : 'outline'"
							size="sm"
							class="h-8 text-xs"
							@click="filtersStore.toggleAuditoriumFilter(auditorium.id)"
						>
							<Icon
								v-if="filtersStore.isAuditoriumActive(auditorium.id)"
								name="lucide:check"
								class="!size-4"
							/>
							{{ auditorium.name }}
						</Button>
					</div>
				</div>

				<div v-if="subjects && subjects.length > 0" class="space-y-3">
					<h3 class="text-foreground text-sm font-semibold">Предмети</h3>
					<div class="flex flex-wrap gap-2">
						<Button
							v-for="subject in subjects"
							:key="subject.id"
							:variant="filtersStore.isSubjectActive(subject.id) ? 'default' : 'outline'"
							size="sm"
							class="h-8 text-xs"
							@click="filtersStore.toggleSubjectFilter(subject.id)"
						>
							<Icon
								v-if="filtersStore.isSubjectActive(subject.id)"
								name="lucide:check"
								class="!size-4"
							/>
							{{ subject.brief }}
						</Button>
					</div>
				</div>
			</div>

			<DialogFooter
				v-if="
					selectedSchedule && ['group', 'teacher', 'auditorium'].includes(selectedSchedule.type)
				"
				class="flex gap-2"
			>
				<Button variant="outline" @click="filtersStore.clearAll">
					<Icon name="lucide:rotate-ccw" class="!size-4" />
					Скинути
				</Button>
				<DialogClose as-child>
					<Button>
						<Icon name="lucide:check" class="!size-4" />
						Зберегти
					</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
