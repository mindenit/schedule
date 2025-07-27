<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query"
import { useInfiniteScroll } from "@vueuse/core"
import { groupsOptions } from "~/core/queries/groups"
import { teachersOptions } from "~/core/queries/teachers"
import { auditoriumsOptions } from "~/core/queries/auditoriums"
import type { Group, Teacher, Auditorium } from "nurekit"
import { ITEMS_PER_PAGE } from "../constants"

const {
	data: groups,
	isLoading: isGroupsLoading,
	isError: isGroupsError,
	error: groupsError,
} = useQuery(groupsOptions())
const {
	data: teachers,
	isLoading: isTeachersLoading,
	isError: isTeachersError,
	error: teachersError,
} = useQuery(teachersOptions())
const {
	data: auditoriums,
	isLoading: isAuditoriumsLoading,
	isError: isAuditoriumsError,
	error: auditoriumsError,
} = useQuery(auditoriumsOptions())

const scheduleStore = useScheduleStore()

const searchQuery = ref("")
const activeTab = ref<ScheduleTabType>("group")

const isDialogOpen = ref(false)

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

	const mappedData = (rawData as any[]).map(config.mapper)

	if (!searchQuery.value.trim()) return mappedData

	return mappedData.filter((item) =>
		item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
	)
}

const getDisplayedItems = (tabType: ScheduleTabType): GenericScheduleItem[] => {
	const filtered = getFilteredItems(tabType)
	return filtered.slice(0, displayCounts[tabType])
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
			if (displayCounts[tab] < filtered.length) {
				displayCounts[tab] += ITEMS_PER_PAGE
			}
		},
		{
			distance: 50,
			canLoadMore: () => {
				const filtered = getFilteredItems(tab)
				return displayCounts[tab] < filtered.length
			},
		}
	)

	resetFunctions[tab] = reset
})

watch(searchQuery, () => {
	Object.keys(displayCounts).forEach((tab) => {
		displayCounts[tab as ScheduleTabType] = ITEMS_PER_PAGE
		resetFunctions[tab as ScheduleTabType]()
	})
})

const handleTabChange = (newTab: string | number) => {
	activeTab.value = String(newTab) as ScheduleTabType
	searchQuery.value = ""
	Object.keys(displayCounts).forEach((tab) => {
		displayCounts[tab as ScheduleTabType] = ITEMS_PER_PAGE
		resetFunctions[tab as ScheduleTabType]()
	})
}

const handleCardClick = (item: GenericScheduleItem) => {
	scheduleStore.addSchedule(item)
	isDialogOpen.value = false
}
</script>

<template>
	<Dialog v-model:open="isDialogOpen">
		<DialogTrigger as-child>
			<Button class="flex-1 min-w-0 gap-1 max-md:hidden">
				<Icon name="lucide:plus" class="!size-4" /> Додати розклад
			</Button>
		</DialogTrigger>

		<DialogTrigger as-child>
			<Button
				class="size-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl md:hidden"
				size="icon"
			>
				<Icon name="lucide:plus" class="!size-6" />
			</Button>
		</DialogTrigger>

		<DialogContent>
			<DialogHeader>
				<DialogTitle>Оберіть розклад</DialogTitle>
			</DialogHeader>
			<Tabs class="w-fill" :model-value="activeTab" @update:model-value="handleTabChange">
				<TabsList class="grid w-full grid-cols-3">
					<TabsTrigger value="group"> Групи </TabsTrigger>
					<TabsTrigger value="teacher"> Викладачі </TabsTrigger>
					<TabsTrigger value="auditorium"> Аудиторії </TabsTrigger>
				</TabsList>
				
				<TabsContent v-for="(config, tabType) in tabConfig" :key="tabType" :value="tabType">
					<div v-if="config.isLoading.value" class="flex justify-center p-4">
						<TheLoader />
					</div>
					<Alert v-else-if="config.isError.value" variant="destructive">
						<AlertTitle>Сталася помилка</AlertTitle>
						<AlertDescription> Деталі: {{ config.error.value?.message }}</AlertDescription>
					</Alert>
					<template v-else-if="config.data.value && config.data.value.length > 0">
						<SearchField v-model="searchQuery" class="mb-2 w-full" />
						<div
							:ref="
								(el: Element | ComponentPublicInstance | null) => {
									scrollRefs[tabType].value = el as HTMLElement | undefined
								}
							"
							class="custom-scrollbar h-[400px] overflow-y-auto"
							style="scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent"
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
							<div v-else class="text-muted-foreground p-4 text-center">
								{{ searchQuery ? config.searchEmptyMessage : config.emptyMessage }}
							</div>
						</div>
					</template>
					<div v-else class="text-muted-foreground p-4 text-center">
						{{ config.emptyMessage }}
					</div>
				</TabsContent>
			</Tabs>
		</DialogContent>
	</Dialog>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	background: hsl(var(--border));
	border-radius: 9999px;
	border-left: 1px solid transparent;
	transition: background-color 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: hsl(var(--border) / 0.8);
}
</style>