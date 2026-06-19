<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { FILTERS_LESSON_TYPES } from "~/constants/filters"
import {
	groupTeachersOptions,
	groupAuditoriumsOptions,
	groupSubjectsOptions,
} from "~/queries/groups"
import {
	teacherGroupsOptions,
	teacherAuditoriumsOptions,
	teacherSubjectsOptions,
} from "~/queries/teachers"
import {
	auditoriumGroupsOptions,
	auditoriumTeachersOptions,
	auditoriumSubjectsOptions,
} from "~/queries/auditoriums"

const props = defineProps<{ class?: string }>()

const filtersStore = useFiltersStore()
const scheduleStore = useScheduleStore()
const { trackEvent } = useAnalytics()

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
			? groupAuditoriumsOptions(selectedSchedule.value.id)
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
	if (!open && filtersStore.hasActive) {
		const { lessonTypes, teachers, auditoriums, subjects, groups } = filtersStore.activeFilters
		trackEvent("filters_applied", {
			lesson_types: lessonTypes.length,
			teachers: teachers.length,
			auditoriums: auditoriums.length,
			subjects: subjects.length,
			groups: groups.length,
		})
	}
})
</script>

<template>
	<UiDialog v-model:open="isOpen">
		<UiDialogTrigger as-child>
			<UiButton variant="outline" size="icon" :class="props.class">
				<AppIcon name="lucide:filter" />
			</UiButton>
		</UiDialogTrigger>

		<UiDialogContent>
			<UiDialogHeader>
				<UiDialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:filter" />
					Фільтри
				</UiDialogTitle>
				<UiDialogDescription> Налаштуйте фільтри для відображення розкладу. </UiDialogDescription>
			</UiDialogHeader>

			<div
				v-if="!selectedSchedule"
				class="text-muted-foreground flex items-center justify-center py-8"
			>
				Оберіть розклад для налаштування фільтрів
			</div>

			<div v-else class="max-h-96 overflow-x-hidden overflow-y-auto">
				<UiAccordion type="multiple" class="space-y-2">
					<UiAccordionItem value="lesson-types">
						<UiAccordionTrigger class="text-sm font-semibold">Типи занять</UiAccordionTrigger>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="lessonType in FILTERS_LESSON_TYPES"
									:key="lessonType.id"
									:label="lessonType.name"
									:is-active="filtersStore.isLessonTypeActive(lessonType.id)"
									@toggle="filtersStore.toggleLessonTypeFilter(lessonType.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem
						v-if="
							groups &&
							groups.length > 0 &&
							(selectedSchedule.type === 'teacher' || selectedSchedule.type === 'auditorium')
						"
						value="groups"
					>
						<UiAccordionTrigger class="text-sm font-semibold">Групи</UiAccordionTrigger>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="group in groups"
									:key="group.id"
									:label="group.name"
									:is-active="filtersStore.isGroupActive(group.id)"
									@toggle="filtersStore.toggleGroupFilter(group.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem
						v-if="
							teachers &&
							teachers.length > 0 &&
							(selectedSchedule.type === 'group' || selectedSchedule.type === 'auditorium')
						"
						value="teachers"
					>
						<UiAccordionTrigger class="text-sm font-semibold">Викладачі</UiAccordionTrigger>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="teacher in teachers"
									:key="teacher.id"
									:label="teacher.shortName"
									:is-active="filtersStore.isTeacherActive(teacher.id)"
									@toggle="filtersStore.toggleTeacherFilter(teacher.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem
						v-if="
							auditoriums &&
							auditoriums.length > 0 &&
							(selectedSchedule.type === 'group' || selectedSchedule.type === 'teacher')
						"
						value="auditoriums"
					>
						<UiAccordionTrigger class="text-sm font-semibold">Аудиторії</UiAccordionTrigger>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="auditorium in auditoriums"
									:key="auditorium.id"
									:label="auditorium.name"
									:is-active="filtersStore.isAuditoriumActive(auditorium.id)"
									@toggle="filtersStore.toggleAuditoriumFilter(auditorium.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem v-if="subjects && subjects.length > 0" value="subjects">
						<UiAccordionTrigger class="text-sm font-semibold">Предмети</UiAccordionTrigger>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="subject in subjects"
									:key="subject.id"
									:label="subject.brief"
									:is-active="filtersStore.isSubjectActive(subject.id)"
									@toggle="filtersStore.toggleSubjectFilter(subject.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>
				</UiAccordion>
			</div>

			<UiDialogFooter
				v-if="
					selectedSchedule && ['group', 'teacher', 'auditorium'].includes(selectedSchedule.type)
				"
				class="flex gap-2"
			>
				<UiButton
					variant="outline"
					@click="
						filtersStore.clearAll()
						trackEvent('filters_reset')
					"
				>
					<AppIcon name="lucide:rotate-ccw" />
					Скинути
				</UiButton>
				<UiDialogClose as-child>
					<UiButton>
						<AppIcon name="lucide:check" />
						Зберегти
					</UiButton>
				</UiDialogClose>
			</UiDialogFooter>
		</UiDialogContent>
	</UiDialog>
</template>
