<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import type { Group, Teacher, Auditorium, Subject } from "@mindenit/nurekit"
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

const props = defineProps<{ class?: string; variant?: "default" | "ghost" }>()

const filtersStore = useFiltersStore()
const scheduleStore = useScheduleStore()
const { trackEvent } = useAnalytics()

const isOpen = ref(false)

const selectedSchedule = computed(() => scheduleStore.selectedSchedule)

const { data: teachers } = useQuery<Teacher[]>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	computed((): any => {
		if (selectedSchedule.value?.type === "group" && selectedSchedule.value?.id) {
			return groupTeachersOptions(selectedSchedule.value.id)
		}
		if (selectedSchedule.value?.type === "auditorium" && selectedSchedule.value?.id) {
			return auditoriumTeachersOptions(selectedSchedule.value.id)
		}
		return {
			queryKey: ["disabled-teachers"],
			queryFn: (): Promise<Teacher[]> => Promise.resolve([]),
			enabled: false,
		}
	})
)

const { data: auditoriums } = useQuery<Auditorium[]>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	computed((): any =>
		selectedSchedule.value?.type === "group" && selectedSchedule.value?.id
			? groupAuditoriumsOptions(selectedSchedule.value.id)
			: selectedSchedule.value?.type === "teacher" && selectedSchedule.value?.id
				? teacherAuditoriumsOptions(selectedSchedule.value.id)
				: {
						queryKey: ["disabled-auditoriums"],
						queryFn: (): Promise<Auditorium[]> => Promise.resolve([]),
						enabled: false,
					}
	)
)

const { data: subjects } = useQuery<Subject[]>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	computed((): any => {
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
			queryFn: (): Promise<Subject[]> => Promise.resolve([]),
			enabled: false,
		}
	})
)

const { data: groups } = useQuery<Group[]>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	computed((): any => {
		if (selectedSchedule.value?.type === "teacher" && selectedSchedule.value?.id) {
			return teacherGroupsOptions(selectedSchedule.value.id)
		}
		if (selectedSchedule.value?.type === "auditorium" && selectedSchedule.value?.id) {
			return auditoriumGroupsOptions(selectedSchedule.value.id)
		}
		return {
			queryKey: ["disabled-groups"],
			queryFn: (): Promise<Group[]> => Promise.resolve([]),
			enabled: false,
		}
	})
)

watch(isOpen, (open) => {
	if (open) {
		trackEvent("filters_opened")
		if (selectedSchedule.value) {
			filtersStore.loadFilters(selectedSchedule.value.id, selectedSchedule.value.type)
		}
	}
	if (!open && filtersStore.hasActive) {
		const active = filtersStore.activeFilters
		trackEvent("filters_applied", {
			lesson_types: active.lessonTypes.length,
			teachers: active.teachers.length,
			auditoriums: active.auditoriums.length,
			subjects: active.subjects.length,
			groups_count: active.groups.length,
		})
	}
})
</script>

<template>
	<UiDialog v-model:open="isOpen">
		<div :class="['relative inline-flex shrink-0', props.class]">
			<UiDialogTrigger as-child>
				<UiButton :variant="props.variant ?? 'default'" size="icon" aria-label="Фільтри">
					<AppIcon name="lucide:filter" />
				</UiButton>
			</UiDialogTrigger>
			<Transition
				enter-active-class="transition-[transform,opacity] duration-200 ease-out"
				enter-from-class="scale-0 opacity-0"
				enter-to-class="scale-100 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-150 ease-in"
				leave-from-class="scale-100 opacity-100"
				leave-to-class="scale-0 opacity-0"
			>
				<span
					v-if="filtersStore.activeCount > 0"
					class="bg-warning text-warning-foreground ring-background absolute -top-1.5
						-right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full p-0.5
						text-[0.625rem] font-medium ring-2"
				>
					{{ filtersStore.activeCount }}
				</span>
			</Transition>
		</div>

		<UiDialogContent>
			<UiDialogHeader>
				<UiDialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:filter" />
					Фільтри
				</UiDialogTitle>
				<UiDialogDescription>
					Налаштуйте фільтри для відображення розкладу.
				</UiDialogDescription>
			</UiDialogHeader>

			<AppEmptyState
				v-if="!selectedSchedule"
				title="Оберіть розклад для налаштування фільтрів"
			/>

			<div v-else class="max-h-96 overflow-x-hidden overflow-y-auto">
				<UiAccordion type="multiple" class="space-y-2">
					<UiAccordionItem value="lesson-types">
						<UiAccordionTrigger class="text-sm font-semibold"
							>Типи занять</UiAccordionTrigger
						>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="lessonType in FILTERS_LESSON_TYPES"
									:key="lessonType.id"
									:label="lessonType.name"
									:is-active="filtersStore.isActive('lessonTypes', lessonType.id)"
									@toggle="filtersStore.toggle('lessonTypes', lessonType.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem
						v-if="
							groups &&
							groups.length > 0 &&
							(selectedSchedule.type === 'teacher' ||
								selectedSchedule.type === 'auditorium')
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
									:is-active="filtersStore.isActive('groups', group.id)"
									@toggle="filtersStore.toggle('groups', group.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem
						v-if="
							teachers &&
							teachers.length > 0 &&
							(selectedSchedule.type === 'group' ||
								selectedSchedule.type === 'auditorium')
						"
						value="teachers"
					>
						<UiAccordionTrigger class="text-sm font-semibold"
							>Викладачі</UiAccordionTrigger
						>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="teacher in teachers"
									:key="teacher.id"
									:label="teacher.shortName"
									:is-active="filtersStore.isActive('teachers', teacher.id)"
									@toggle="filtersStore.toggle('teachers', teacher.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem
						v-if="
							auditoriums &&
							auditoriums.length > 0 &&
							(selectedSchedule.type === 'group' ||
								selectedSchedule.type === 'teacher')
						"
						value="auditoriums"
					>
						<UiAccordionTrigger class="text-sm font-semibold"
							>Аудиторії</UiAccordionTrigger
						>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="auditorium in auditoriums"
									:key="auditorium.id"
									:label="auditorium.name"
									:is-active="filtersStore.isActive('auditoriums', auditorium.id)"
									@toggle="filtersStore.toggle('auditoriums', auditorium.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>

					<UiAccordionItem v-if="subjects && subjects.length > 0" value="subjects">
						<UiAccordionTrigger class="text-sm font-semibold"
							>Предмети</UiAccordionTrigger
						>
						<UiAccordionContent>
							<div class="flex flex-wrap gap-2 pt-2">
								<FiltersCheckButton
									v-for="subject in subjects"
									:key="subject.id"
									:label="subject.brief"
									:is-active="filtersStore.isActive('subjects', subject.id)"
									@toggle="filtersStore.toggle('subjects', subject.id)"
								/>
							</div>
						</UiAccordionContent>
					</UiAccordionItem>
				</UiAccordion>
			</div>

			<UiDialogFooter
				v-if="
					selectedSchedule &&
					['group', 'teacher', 'auditorium'].includes(selectedSchedule.type)
				"
				class="flex gap-2"
			>
				<UiButton
					variant="outline"
					@click="
						() => {
							filtersStore.clearAll()
							trackEvent('filters_reset')
							useSonner.info('Фільтри скинуто')
						}
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
