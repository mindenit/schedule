<script setup lang="ts">
import { storeToRefs } from "pinia"
import { parseISO, format, isSameDay } from "date-fns"

interface Props {
	events: ICalendarEvent[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, use24HourFormat } = storeToRefs(calendarStore)

const hours = Array.from({ length: 24 }, (_, i) => i)

const dayEvents = computed(() => {
	return props.events.filter((event) => {
		const eventDate = parseISO(event.startDate)
		return isSameDay(eventDate, selectedDate.value)
	})
})

const groupedEvents = computed(() => groupEvents(dayEvents.value))

function formatHour(hour: number): string {
	const date = new Date().setHours(hour, 0, 0, 0)
	return format(date, use24HourFormat.value ? "HH:00" : "h a")
}
</script>

<template>
	<div class="flex h-full overflow-hidden rounded-lg">
		<div class="flex flex-1 flex-col overflow-hidden">
			<div class="flex min-h-0 flex-1 gap-1 overflow-hidden">
				<div class="relative flex w-18 flex-shrink-0 flex-col">
					<div
						v-for="(hour, index) in hours"
						:key="hour"
						class="bg-muted/50 relative flex flex-1 items-start justify-end pr-2"
						:style="{ minHeight: `${100 / hours.length}%` }"
					>
						<span v-if="index !== 0" class="text-muted-foreground mt-1 text-xs">
							{{ formatHour(hour) }}
						</span>
					</div>
				</div>

				<div class="relative flex-1 overflow-hidden">
					<div class="flex h-full flex-col gap-1">
						<div
							v-for="hour in hours"
							:key="hour"
							class="bg-card relative min-h-[48px]"
							:style="{ height: `${(100 - (hours.length - 1) * 0.25) / hours.length}%` }"
						></div>
					</div>
					<div class="absolute inset-0">
						<CalendarEventRenderer :grouped-events="groupedEvents" :day="selectedDate" />
					</div>
					<CalendarTimeline />
				</div>
			</div>
		</div>
	</div>
</template>
