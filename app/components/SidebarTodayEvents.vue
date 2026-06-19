<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { startOfDay, endOfDay } from "date-fns"
import { useScheduleQuery } from "~/composables/useScheduleQuery"
import type { TEventType } from "~/types/calendar"

const scheduleStore = useScheduleStore()
const { selectedSchedule } = storeToRefs(scheduleStore)
const { formatTime, formatDate, capitalize } = useEventFormatting()

const today = new Date()

const formattedDate = computed(() => {
	const day = capitalize(formatDate(today, "EEEE"))
	const date = formatDate(today, "d MMMM")
	return `${day}, ${date}`
})

const startTimestamp = computed(() => {
	return Math.floor(startOfDay(today).getTime() / 1000)
})

const endTimestamp = computed(() => {
	return Math.floor(endOfDay(today).getTime() / 1000)
})

const scheduleId = computed(() => selectedSchedule.value?.id)

const { data: todayEvents, isLoading } = useScheduleQuery(scheduleId, startTimestamp, endTimestamp)

const hasActiveSchedule = computed(() => !!selectedSchedule.value)
const hasEvents = computed(() => todayEvents.value && todayEvents.value.length > 0)
</script>

<template>
	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<div class="text-base font-semibold">{{ formattedDate }}</div>

		<ClientOnly>
			<template #fallback>
				<div class="flex flex-col gap-3">
					<UiSkeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-md" />
				</div>
			</template>
			<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
				<UiScrollArea class="min-h-0 flex-1">
					<div class="flex flex-col gap-3">
						<div v-if="isLoading && hasActiveSchedule" class="flex justify-center p-4">
							<TheLoader />
						</div>
						<template v-else-if="hasActiveSchedule && hasEvents">
							<SidebarEvent
								v-for="event in todayEvents"
								:key="event.id"
								:start-time="formatTime(event.startedAt)"
								:end-time="formatTime(event.endedAt)"
								:auditorium="event.auditorium.name"
								:type="event.type as TEventType"
								:name="event.subject.title"
							/>
						</template>
						<AppEmptyState
							v-else-if="hasActiveSchedule && !hasEvents && !isLoading"
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
