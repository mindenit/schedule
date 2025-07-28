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

			<div v-else class="max-h-96 overflow-x-hidden overflow-y-auto">
				<Accordion type="multiple" class="space-y-2">
					<AccordionItem value="lesson-types">
						<AccordionTrigger class="text-sm font-semibold">Типи занять</AccordionTrigger>
						<AccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="lessonType in FILTERS_LESSON_TYPES"
									:key="lessonType.id"
									:label="lessonType.name"
									:is-active="filtersStore.isLessonTypeActive(lessonType.id)"
									@toggle="filtersStore.toggleLessonTypeFilter(lessonType.id)"
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem
						v-if="
							groups &&
							groups.length > 0 &&
							(selectedSchedule.type === 'teacher' || selectedSchedule.type === 'auditorium')
						"
						value="groups"
					>
						<AccordionTrigger class="text-sm font-semibold">Групи</AccordionTrigger>
						<AccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="group in groups"
									:key="group.id"
									:label="group.name"
									:is-active="filtersStore.isGroupActive(group.id)"
									@toggle="filtersStore.toggleGroupFilter(group.id)"
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem
						v-if="
							teachers &&
							teachers.length > 0 &&
							(selectedSchedule.type === 'group' || selectedSchedule.type === 'auditorium')
						"
						value="teachers"
					>
						<AccordionTrigger class="text-sm font-semibold">Викладачі</AccordionTrigger>
						<AccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="teacher in teachers"
									:key="teacher.id"
									:label="teacher.shortName"
									:is-active="filtersStore.isTeacherActive(teacher.id)"
									@toggle="filtersStore.toggleTeacherFilter(teacher.id)"
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem
						v-if="
							auditoriums &&
							auditoriums.length > 0 &&
							(selectedSchedule.type === 'group' || selectedSchedule.type === 'teacher')
						"
						value="auditoriums"
					>
						<AccordionTrigger class="text-sm font-semibold">Аудиторії</AccordionTrigger>
						<AccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="auditorium in auditoriums"
									:key="auditorium.id"
									:label="auditorium.name"
									:is-active="filtersStore.isAuditoriumActive(auditorium.id)"
									@toggle="filtersStore.toggleAuditoriumFilter(auditorium.id)"
								/>
							</div>
						</AccordionContent>
					</AccordionItem>

					<AccordionItem v-if="subjects && subjects.length > 0" value="subjects">
						<AccordionTrigger class="text-sm font-semibold">Предмети</AccordionTrigger>
						<AccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="subject in subjects"
									:key="subject.id"
									:label="subject.brief"
									:is-active="filtersStore.isSubjectActive(subject.id)"
									@toggle="filtersStore.toggleSubjectFilter(subject.id)"
								/>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
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
