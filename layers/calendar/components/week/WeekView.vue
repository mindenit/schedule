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

// Week options for Monday start
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
</script>

<template>
	<div class="flex flex-col">
		<div class="flex flex-col">
			<div class="relative z-20 flex border-b">
				<div class="w-18"></div>
				<div class="grid flex-1 grid-cols-7">
					<span
						v-for="(day, index) in weekDays"
						:key="index"
						class="text-muted-foreground py-2 text-center text-xs font-medium transition-all duration-200"
						:class="{
							'bg-primary/5': isSameDay(day, new Date()),
						}"
					>
						{{ format(day, "E", { locale: uk }) }}
						<span class="text-foreground ml-1 font-semibold">
							{{ format(day, "d") }}
						</span>
					</span>
				</div>
			</div>

			<div class="h-[736px] overflow-auto">
				<div class="flex">
					<div class="relative w-18">
						<div
							v-for="(hour, index) in hours"
							:key="hour"
							class="relative"
							:style="{ height: WEEK_VIEW_ROW_HEIGHT + 'px' }"
						>
							<div class="absolute -top-3 right-2 flex h-6 items-center">
								<span v-if="index !== 0" class="text-muted-foreground text-xs">
									{{ formatHour(hour) }}
								</span>
							</div>
						</div>
					</div>

					<div class="relative flex-1 border-l">
						<div class="grid grid-cols-7 divide-x">
							<div v-for="(day, dayIndex) in weekDays" :key="dayIndex" class="relative">
								<div
									v-for="(hour, index) in hours"
									:key="hour"
									class="relative"
									:style="{ height: WEEK_VIEW_ROW_HEIGHT + 'px' }"
								>
									<div
										v-if="index !== 0"
										class="pointer-events-none absolute inset-x-0 top-0 border-b"
									/>
								</div>

								<CalendarEventRenderer :grouped-events="getGroupedEventsForDay(day)" :day="day" />
							</div>
						</div>

						<!-- Current time line -->
						<CalendarTimeline />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
ч
