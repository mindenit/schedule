<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { useInfiniteScroll } from "@vueuse/core"
import { groupsOptions } from "~/queries/groups"
import { teachersOptions } from "~/queries/teachers"
import { auditoriumsOptions } from "~/queries/auditoriums"
import type { Group, Teacher, Auditorium } from "nurekit"
import { ITEMS_PER_PAGE } from "~/constants/schedule"
import type { ScheduleTabType, GenericScheduleItem } from "~/types/schedule"

const scheduleStore = useScheduleStore()
const { trackEvent } = useAnalytics()

const searchQuery = ref("")
const activeTab = ref<ScheduleTabType>("group")

const isDialogOpen = ref(false)

const {
	data: groups,
	isLoading: isGroupsLoading,
	isError: isGroupsError,
	error: groupsError,
} = useQuery({ ...groupsOptions(), enabled: isDialogOpen })
const {
	data: teachers,
	isLoading: isTeachersLoading,
	isError: isTeachersError,
	error: teachersError,
} = useQuery({ ...teachersOptions(), enabled: isDialogOpen })
const {
	data: auditoriums,
	isLoading: isAuditoriumsLoading,
	isError: isAuditoriumsError,
	error: auditoriumsError,
} = useQuery({ ...auditoriumsOptions(), enabled: isDialogOpen })

interface TabConfig<T> {
	data: Ref<T[] | undefined>
	isLoading: Ref<boolean>
	isError: Ref<boolean>
	error: Ref<Error | null>
	icon: "group" | "teacher" | "auditorium"
	emptyMessage: string
	searchEmptyMessage: string
	mapper: (item: T) => GenericScheduleItem
}

const tabConfig = {
	group: {
		data: groups,
		isLoading: isGroupsLoading,
		isError: isGroupsError,
		error: groupsError,
		icon: "group" as const,
		emptyMessage: "Групи не знайдено",
		searchEmptyMessage: "Нічого не знайдено за запитом",
		mapper: (item: Group): GenericScheduleItem => ({
			id: item.id,
			name: item.name,
			type: "group",
		}),
	} satisfies TabConfig<Group>,
	teacher: {
		data: teachers,
		isLoading: isTeachersLoading,
		isError: isTeachersError,
		error: teachersError,
		icon: "teacher" as const,
		emptyMessage: "Викладачів не знайдено",
		searchEmptyMessage: "Нічого не знайдено за запитом",
		mapper: (item: Teacher): GenericScheduleItem => ({
			id: item.id,
			name: item.shortName,
			type: "teacher",
		}),
	} satisfies TabConfig<Teacher>,
	auditorium: {
		data: auditoriums,
		isLoading: isAuditoriumsLoading,
		isError: isAuditoriumsError,
		error: auditoriumsError,
		icon: "auditorium" as const,
		emptyMessage: "Аудиторій не знайдено",
		searchEmptyMessage: "Нічого не знайдено за запитом",
		mapper: (item: Auditorium): GenericScheduleItem => ({
			id: item.id,
			name: item.name,
			type: "auditorium",
		}),
	} satisfies TabConfig<Auditorium>,
} as const

const displayCounts = reactive({
	group: ITEMS_PER_PAGE,
	teacher: ITEMS_PER_PAGE,
	auditorium: ITEMS_PER_PAGE,
})

const scrollRefs = {
	group: ref<HTMLElement>(),
	teacher: ref<HTMLElement>(),
	auditorium: ref<HTMLElement>(),
}

const getFilteredItems = (tabType: ScheduleTabType): GenericScheduleItem[] => {
	const config = tabConfig[tabType]
	const rawData = config.data.value

	if (!rawData) return []

	const mappedData = (rawData as unknown[]).map(
		config.mapper as (item: unknown) => GenericScheduleItem
	)

	if (!searchQuery.value.trim()) return mappedData

	return mappedData.filter((item) =>
		item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
	)
}

const getDisplayedItems = (tabType: ScheduleTabType): GenericScheduleItem[] => {
	const filtered = getFilteredItems(tabType)
	const count = displayCounts[tabType] ?? ITEMS_PER_PAGE
	return filtered.slice(0, count)
}

const resetFunctions: Record<ScheduleTabType, () => void> = {} as Record<
	ScheduleTabType,
	() => void
>

Object.keys(tabConfig).forEach((tabType) => {
	const tab = tabType as ScheduleTabType

	const { reset } = useInfiniteScroll(
		scrollRefs[tab],
		() => {
			const filtered = getFilteredItems(tab)
			const current = displayCounts[tab] ?? 0
			if (current < filtered.length) {
				displayCounts[tab] = current + ITEMS_PER_PAGE
			}
		},
		{
			distance: 50,
			canLoadMore: () => {
				const filtered = getFilteredItems(tab)
				const current = displayCounts[tab] ?? 0
				return current < filtered.length
			},
		}
	)

	resetFunctions[tab] = reset
})

watch(searchQuery, () => {
	Object.keys(displayCounts).forEach((tab) => {
		const key = tab as ScheduleTabType
		displayCounts[key] = ITEMS_PER_PAGE
		resetFunctions[key]?.()
	})
})

const handleTabChange = (newTab: string | number) => {
	activeTab.value = String(newTab) as ScheduleTabType
	searchQuery.value = ""
	Object.keys(displayCounts).forEach((tab) => {
		const key = tab as ScheduleTabType
		displayCounts[key] = ITEMS_PER_PAGE
		resetFunctions[key]?.()
	})
}

const handleCardClick = (item: GenericScheduleItem) => {
	scheduleStore.addSchedule(item)
	trackEvent("schedule_added", { type: item.type })
	isDialogOpen.value = false
}
</script>

<template>
	<UiDialog v-model:open="isDialogOpen">
		<UiDialogTrigger as-child>
			<UiButton class="min-w-0 flex-1 gap-1 max-md:hidden">
				<AppIcon name="lucide:plus" /> Додати розклад
			</UiButton>
		</UiDialogTrigger>

		<UiDialogTrigger as-child>
			<UiButton
				class="size-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl md:hidden"
				size="icon"
				aria-label="Додати розклад"
			>
				<AppIcon name="lucide:plus" size="lg" />
			</UiButton>
		</UiDialogTrigger>

		<UiDialogContent>
			<UiDialogHeader>
				<UiDialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:calendar-plus" />
					Оберіть розклад
				</UiDialogTitle>
				<UiDialogDescription>Оберіть групу, викладача або аудиторію</UiDialogDescription>
			</UiDialogHeader>
			<UiTabs class="w-fill" :model-value="activeTab" @update:model-value="handleTabChange">
				<UiTabsList class="grid w-full grid-cols-3">
					<UiTabsTrigger value="group"> Групи </UiTabsTrigger>
					<UiTabsTrigger value="teacher"> Викладачі </UiTabsTrigger>
					<UiTabsTrigger value="auditorium"> Аудиторії </UiTabsTrigger>
				</UiTabsList>

				<UiTabsContent v-for="(config, tabType) in tabConfig" :key="tabType" :value="tabType">
					<div v-if="config.isLoading.value" class="flex justify-center p-4">
						<TheLoader />
					</div>
					<UiAlert v-else-if="config.isError.value" variant="destructive">
						<UiAlertTitle>Сталася помилка</UiAlertTitle>
						<UiAlertDescription> Деталі: {{ config.error.value?.message }}</UiAlertDescription>
					</UiAlert>
					<template v-else-if="config.data.value && config.data.value.length > 0">
						<SearchField v-model="searchQuery" class="mb-2 w-full" />
						<div
							:ref="
								(el: Element | ComponentPublicInstance | null) => {
									scrollRefs[tabType].value = el as HTMLElement | undefined
								}
							"
						class="custom-scrollbar h-[400px] overflow-y-auto"
						style="scrollbar-width: thin; scrollbar-color: var(--border) transparent"
						tabindex="0"
						role="region"
						:aria-label="`Список ${tabType === 'group' ? 'груп' : tabType === 'teacher' ? 'викладачів' : 'аудиторій'}`"
					>
							<template v-if="getDisplayedItems(tabType).length > 0">
								<ScheduleDialogCard
									v-for="item in getDisplayedItems(tabType)"
									:id="item.id"
									:key="item.id"
									:icon="config.icon"
									:name="item.name"
									@click="handleCardClick(item)"
								/>

								<div
									v-if="displayCounts[tabType] < getFilteredItems(tabType).length"
									class="flex justify-center p-4"
								>
									<div class="text-muted-foreground text-sm">
										Показано {{ getDisplayedItems(tabType).length }} з
										{{ getFilteredItems(tabType).length }}
									</div>
								</div>
							</template>
							<AppEmptyState
								v-else
								:title="searchQuery ? config.searchEmptyMessage : config.emptyMessage"
							/>
						</div>
					</template>
					<AppEmptyState v-else :title="config.emptyMessage" />
				</UiTabsContent>
			</UiTabs>
		</UiDialogContent>
	</UiDialog>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	background: var(--border);
	border-radius: 9999px;
	border-left: 1px solid transparent;
	transition: background-color 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: color-mix(in oklch, var(--border) 80%, transparent);
}
</style>
