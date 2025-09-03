<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { startOfDay, endOfDay } from "date-fns"
import { useScheduleQuery } from "../composables/useScheduleQuery"
import ScrollArea from "./ui/scroll-area/ScrollArea.vue"

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
			<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
				<ScrollArea class="min-h-0 flex-1">
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
						<div
							v-else-if="hasActiveSchedule && !hasEvents && !isLoading"
							class="text-muted-foreground flex flex-col items-center justify-center gap-2 p-6 text-center"
						>
							<AppIcon name="lucide:smile" size="xl" class="opacity-50" />
							<p class="text-sm">
								Пар на сьогодні <br /><span class="text-lg font-semibold">немає</span>
							</p>
						</div>
						<div
							v-else
							class="text-muted-foreground flex flex-col items-center justify-center gap-2 p-6 text-center"
						>
							<AppIcon name="lucide:calendar-plus" size="xl" class="opacity-50" />
							<p class="text-sm">Оберіть розклад для перегляду пар</p>
						</div>
					</div>
				</ScrollArea>
			</div>
		</ClientOnly>
	</div>
</template>
