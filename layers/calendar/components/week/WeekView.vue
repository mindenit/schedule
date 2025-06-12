<script setup lang="ts">
import { computed } from "vue"
import { storeToRefs } from "pinia"
import { startOfWeek, addDays, format, parseISO, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"

interface Props {
	events: ICalendarEvent[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate, use24HourFormat } = storeToRefs(calendarStore)

const weekOptions = { weekStartsOn: 1 as const }
const weekStart = computed(() => startOfWeek(selectedDate.value, weekOptions))
const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart.value, i)))
const hours = Array.from({ length: 24 }, (_, i) => i)

const getDayEvents = (day: Date) => {
	return props.events.filter((event) => isSameDay(parseISO(event.startDate), day))
}

const getGroupedEventsForDay = (day: Date) => {
	const dayEvents = getDayEvents(day)
	return groupEvents(dayEvents)
}

function formatHour(hour: number): string {
	const date = new Date().setHours(hour, 0, 0, 0)
	return format(date, use24HourFormat.value ? "HH:00" : "h a")
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
</script>

<template>
	<div class="flex flex-col">
		<div class="overflow-x-auto">
			<div class="min-w-[800px]">
				<div class="bg-card relative z-20 mb-1 grid grid-cols-[72px_1fr] gap-1">
					<div class="col-start-2 grid grid-cols-7 gap-1">
						<span
							v-for="(day, index) in weekDays"
							:key="index"
							class="text-muted-foreground flex min-w-[100px] flex-col items-center gap-1 py-2 text-center text-xs
								font-medium transition-all duration-200"
						>
							<span class="hidden sm:block">{{
								capitalize(format(day, "EEEE", { locale: uk }))
							}}</span>
							<span class="block sm:hidden">{{
								capitalize(format(day, "EEE", { locale: uk }))
							}}</span>
							<span
								class="text-md flex size-5 items-center justify-center rounded-full font-semibold"
								:class="{
									'bg-primary text-foreground': isSameDay(day, new Date()),
								}"
							>
								{{ format(day, "d") }}
							</span>
						</span>
					</div>
				</div>

				<div class="grid grid-cols-[72px_1fr] gap-1">
					<div class="relative">
						<div
							v-for="(hour, index) in hours"
							:key="hour"
							class="bg-card relative"
							:style="{ height: WEEK_VIEW_ROW_HEIGHT + 'px' }"
						>
							<div class="absolute -top-3 right-2 flex h-6 items-center">
								<span v-if="index !== 0" class="text-muted-foreground text-xs whitespace-nowrap">
									{{ formatHour(hour) }}
								</span>
							</div>
						</div>
					</div>

					<div class="relative">
						<div class="grid h-full grid-cols-7 gap-1">
							<div v-for="day in weekDays" :key="day" class="relative min-w-[100px]">
								<div class="grid h-full grid-rows-24 gap-1">
									<div v-for="hour in hours" :key="hour" class="bg-card relative"></div>
								</div>
								<CalendarEventRenderer :grouped-events="getGroupedEventsForDay(day)" :day="day" />
							</div>
						</div>
						<CalendarTimeline />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
