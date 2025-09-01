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
const hours = CALENDAR_HOURS

const getDayEvents = (day: Date) => getEventsForDate(props.events, day)
const getGroupedEventsForDay = (day: Date) => groupEvents(getDayEvents(day))

const hasEvents = computed(() => {
	return weekDays.value.some((day) => getDayEvents(day).length > 0)
})
</script>

<template>
	<div class="relative flex h-full flex-col">
		<div class="flex flex-1 flex-col overflow-x-auto" :class="{ 'blur-sm': !hasEvents }">
			<div class="flex min-w-[800px] flex-1 flex-col">
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

				<div class="grid min-h-0 flex-1 grid-cols-[72px_1fr] gap-1">
					<div class="relative flex flex-col">
						<div
							v-for="(hour, index) in hours"
							:key="hour"
							class="bg-muted/50 relative flex-1"
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

					<div class="relative min-h-0 flex-1">
						<div class="grid h-full grid-cols-7 gap-1">
							<div
								v-for="(day, dayIndex) in weekDays"
								:key="day.getTime()"
								class="relative min-w-[100px]"
							>
								<div class="flex h-full flex-col gap-1">
									<div
										v-for="(hour, hourIndex) in hours"
										:key="hour"
										class="bg-card relative flex-1"
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
						<BigCalendarTimeline :week-days="weekDays" />
					</div>
				</div>
			</div>
		</div>

		<BigCalendarEmptyStateOverlay
			:show="!hasEvents"
			description="У цьому тижні немає заплнованих пар"
		/>
	</div>
</template>
