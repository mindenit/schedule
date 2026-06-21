<script lang="ts" setup>
import { isSameDay, addDays, subDays, isToday } from "date-fns"
import { storeToRefs } from "pinia"
import type { TEventType } from "~/types/calendar"

const scheduleStore = useScheduleStore()
const calendarStore = useCalendarStore()
const { selectedSchedule } = storeToRefs(scheduleStore)
const { allEvents } = storeToRefs(calendarStore)
const { formatTime, formatDate, capitalize } = useEventFormatting()

// Dev-only date override — lets you navigate days to test sidebar event rendering.
// Always starts at today; tree-shaken out in production builds.
const previewDate = ref(new Date())
const isDev = import.meta.dev
const isPreviewToday = computed(() => isToday(previewDate.value))

const formattedDate = computed(() => {
	const day = capitalize(formatDate(previewDate.value, "EEEE"))
	const date = formatDate(previewDate.value, "d MMMM")
	return `${day}, ${date}`
})

// Filter the already-loaded full-year events to the preview date — no extra network request.
// 3.3 fix: guard auditorium?.name — auditorium can be null for online lessons.
const todayEvents = computed(() =>
	allEvents.value.filter((e) => isSameDay(new Date(e.startedAt * 1000), previewDate.value))
)

const hasActiveSchedule = computed(() => !!selectedSchedule.value)
const hasEvents = computed(() => todayEvents.value.length > 0)
</script>

<template>
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<div class="flex items-center gap-1">
			<span class="flex-1 text-base font-semibold">{{ formattedDate }}</span>
			<template v-if="isDev">
				<UiButton
					size="icon"
					variant="ghost"
					class="size-6"
					@click="previewDate = subDays(previewDate, 1)"
				>
					<Icon name="lucide:chevron-left" class="size-3" />
				</UiButton>
				<UiButton
					v-if="!isPreviewToday"
					size="icon"
					variant="ghost"
					class="size-6"
					@click="previewDate = new Date()"
				>
					<Icon name="lucide:rotate-ccw" class="size-3" />
				</UiButton>
				<UiButton
					size="icon"
					variant="ghost"
					class="size-6"
					@click="previewDate = addDays(previewDate, 1)"
				>
					<Icon name="lucide:chevron-right" class="size-3" />
				</UiButton>
			</template>
		</div>

		<ClientOnly>
			<template #fallback>
				<div class="flex flex-col gap-3">
					<UiSkeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-md" />
				</div>
			</template>
			<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
				<UiScrollArea class="min-h-0 flex-1">
					<div class="flex flex-col gap-3">
						<template v-if="hasActiveSchedule && hasEvents">
							<SidebarEvent
								v-for="event in todayEvents"
								:key="event.id"
								:start-time="formatTime(event.startedAt)"
								:end-time="formatTime(event.endedAt)"
								:auditorium="event.auditorium?.name ?? 'Не вказана'"
								:type="event.type as TEventType"
								:name="event.subject.title"
							/>
						</template>
						<AppEmptyState
							v-else-if="hasActiveSchedule && !hasEvents"
							variant="sidebar"
							icon="lucide:smile"
							title="Пар на сьогодні немає"
						/>
						<AppEmptyState
							v-else
							variant="sidebar"
							icon="lucide:calendar-plus"
							title="Оберіть розклад для перегляду пар"
						/>
					</div>
				</UiScrollArea>
			</div>
		</ClientOnly>
	</div>
</template>
