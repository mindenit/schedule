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

const props = defineProps<{ class?: string }>()

const filtersStore = useFiltersStore()
const scheduleStore = useScheduleStore()

const isOpen = ref(false)

const lessonTypes = [
	{ id: "Лк", name: "Лекція" },
	{ id: "Пз", name: "Практичне заняття" },
	{ id: "Лб", name: "Лабораторна робота" },
	{ id: "Конс", name: "Консультація" },
	{ id: "Зал", name: "Залік" },
	{ id: "Екз", name: "Екзамен" },
]

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

		<DialogContent class="max-w-md">
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

			<div v-else class="max-h-96 space-y-4 overflow-y-auto">
				<div class="space-y-3">
					<h3 class="text-sm font-medium">Типи занять</h3>
					<div class="space-y-2">
						<div
							v-for="lessonType in lessonTypes"
							:key="lessonType.id"
							class="flex items-center space-x-2"
						>
							<input
								:id="`lesson-${lessonType.id}`"
								type="checkbox"
								:checked="filtersStore.isLessonTypeActive(lessonType.id)"
								class="size-4 rounded border-gray-300"
								@change="filtersStore.toggleLessonTypeFilter(lessonType.id)"
							/>
							<label :for="`lesson-${lessonType.id}`" class="cursor-pointer text-sm font-medium">
								{{ lessonType.name }}
							</label>
						</div>
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
					<h3 class="text-sm font-medium">Групи</h3>
					<div class="space-y-2">
						<div v-for="group in groups" :key="group.id" class="flex items-center space-x-2">
							<input
								:id="`group-${group.id}`"
								type="checkbox"
								:checked="filtersStore.isGroupActive(group.id)"
								class="size-4 rounded border-gray-300"
								@change="filtersStore.toggleGroupFilter(group.id)"
							/>
							<label :for="`group-${group.id}`" class="cursor-pointer text-sm font-medium">
								{{ group.name }}
							</label>
						</div>
					</div>
				</div>

				<div
					v-if="teachers && teachers.length > 0 && selectedSchedule.type === 'group'"
					class="space-y-3"
				>
					<h3 class="text-sm font-medium">Викладачі</h3>
					<div class="space-y-2">
						<div v-for="teacher in teachers" :key="teacher.id" class="flex items-center space-x-2">
							<input
								:id="`teacher-${teacher.id}`"
								type="checkbox"
								:checked="filtersStore.isTeacherActive(teacher.id)"
								class="size-4 rounded border-gray-300"
								@change="filtersStore.toggleTeacherFilter(teacher.id)"
							/>
							<label :for="`teacher-${teacher.id}`" class="cursor-pointer text-sm font-medium">
								{{ teacher.shortName }}
							</label>
						</div>
					</div>
				</div>

				<div
					v-if="teachers && teachers.length > 0 && selectedSchedule.type === 'auditorium'"
					class="space-y-3"
				>
					<h3 class="text-sm font-medium">Викладачі</h3>
					<div class="space-y-2">
						<div v-for="teacher in teachers" :key="teacher.id" class="flex items-center space-x-2">
							<input
								:id="`teacher-${teacher.id}`"
								type="checkbox"
								:checked="filtersStore.isTeacherActive(teacher.id)"
								class="size-4 rounded border-gray-300"
								@change="filtersStore.toggleTeacherFilter(teacher.id)"
							/>
							<label :for="`teacher-${teacher.id}`" class="cursor-pointer text-sm font-medium">
								{{ teacher.shortName }}
							</label>
						</div>
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
					<h3 class="text-sm font-medium">Аудиторії</h3>
					<div class="space-y-2">
						<div
							v-for="auditorium in auditoriums"
							:key="auditorium.id"
							class="flex items-center space-x-2"
						>
							<input
								:id="`auditorium-${auditorium.id}`"
								type="checkbox"
								:checked="filtersStore.isAuditoriumActive(auditorium.id)"
								class="size-4 rounded border-gray-300"
								@change="filtersStore.toggleAuditoriumFilter(auditorium.id)"
							/>
							<label
								:for="`auditorium-${auditorium.id}`"
								class="cursor-pointer text-sm font-medium"
							>
								{{ auditorium.name }}
							</label>
						</div>
					</div>
				</div>

				<div v-if="subjects && subjects.length > 0" class="space-y-3">
					<h3 class="text-sm font-medium">Предмети</h3>
					<div class="space-y-2">
						<div v-for="subject in subjects" :key="subject.id" class="flex items-center space-x-2">
							<input
								:id="`subject-${subject.id}`"
								type="checkbox"
								:checked="filtersStore.isSubjectActive(subject.id)"
								class="size-4 rounded border-gray-300"
								@change="filtersStore.toggleSubjectFilter(subject.id)"
							/>
							<label :for="`subject-${subject.id}`" class="cursor-pointer text-sm font-medium">
								{{ subject.brief }}
							</label>
						</div>
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
					<Icon name="lucide:rotate-ccw" class="mr-2 !size-4" />
					Скинути
				</Button>
				<DialogClose as-child>
					<Button>
						<Icon name="lucide:check" class="mr-2 !size-4" />
						Закрити
					</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
