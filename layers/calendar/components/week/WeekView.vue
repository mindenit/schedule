<script setup lang="ts">
import { storeToRefs } from "pinia"
import { format, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"

interface Props {
	events: Schedule[]
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { selectedDate } = storeToRefs(calendarStore)

const { getWeekDaysDetailed } = useCalendarCells()
const { getEventsForDate, groupEvents } = useEventGrouping()
const { formatHour, capitalize } = useEventFormatting()

const weekDays = computed(() => getWeekDaysDetailed(selectedDate.value))
const hours = Array.from({ length: 24 }, (_, i) => i)

const getDayEvents = (day: Date) => getEventsForDate(props.events, day)
const getGroupedEventsForDay = (day: Date) => groupEvents(getDayEvents(day))
</script>

<template>
	<div class="flex flex-col">
		<div class="overflow-x-auto">
			<div ref="" class="min-w-[800px]">
				<div class="bg-muted/50 relative z-20 mb-1 grid grid-cols-[72px_1fr] gap-1 md:rounded-t-lg">
					<div class="col-start-2 grid grid-cols-7 gap-1">
						<span
							v-for="(day, index) in weekDays"
							:key="index"
							class="text-muted-foreground flex min-w-[100px] flex-col items-center gap-1 py-2 text-center text-xs
								font-medium transition-all duration-200"
						>
							<span class="hidden sm:block">
								{{ capitalize(format(day, "EEEE", { locale: uk })) }}
							</span>
							<span class="block sm:hidden">
								{{ capitalize(format(day, "EEE", { locale: uk })) }}
							</span>
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
							class="bg-muted/50 relative"
							:style="{ height: WEEK_VIEW_ROW_HEIGHT + 'px' }"
							:class="{
								'rounded-bl-lg': index === hours.length - 1,
							}"
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
							<div
								v-for="(day, dayIndex) in weekDays"
								:key="day.getTime()"
								class="relative min-w-[100px]"
							>
								<div class="grid h-full grid-rows-24 gap-1">
									<div
										v-for="(hour, hourIndex) in hours"
										:key="hour"
										class="bg-card relative"
										:class="{
											'rounded-br-lg':
												dayIndex === weekDays.length - 1 && hourIndex === hours.length - 1,
										}"
									></div>
								</div>
								<BigCalendarEventRenderer
									:grouped-events="getGroupedEventsForDay(day)"
									:day="day"
								/>
							</div>
						</div>
						<BigCalendarTimeline />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
