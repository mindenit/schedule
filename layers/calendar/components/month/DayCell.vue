<script setup lang="ts">
import { isToday, startOfDay } from "date-fns"
import type { Schedule } from "nurekit"

interface Props {
	cell: ICalendarCell
	events: Schedule[]
	eventPositions: Record<string, number>
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { groupEventsBySameTime, getEventsForDate } = useEventGrouping()

const groupedCellEvents = computed(() => {
	const eventsForDate = getEventsForDate(props.events, props.cell.date)
	return groupEventsBySameTime(eventsForDate)
})

const isCurrentMonth = computed(() => props.cell.currentMonth)
const isDateToday = computed(() => isToday(props.cell.date))

const dayClasses = computed(() => ({
	"text-muted-foreground/50": !isCurrentMonth.value,
	"text-muted-foreground": isCurrentMonth.value && !isDateToday.value,
	"bg-primary": isDateToday.value,
}))

const containerClasses = computed(() => ({
	"opacity-80": !isCurrentMonth.value,
}))

const allGroups = computed(() => groupedCellEvents.value)
const displayGroups = computed(() => allGroups.value.slice(0, MAX_VISIBLE_EVENTS_PER_DAY))
const hasMoreEvents = computed(() => allGroups.value.length > MAX_VISIBLE_EVENTS_PER_DAY)

const remainingEventsCount = computed(() => {
	if (!hasMoreEvents.value) return 0
	return allGroups.value
		.slice(MAX_VISIBLE_EVENTS_PER_DAY)
		.reduce((total, group) => total + group.length, 0)
})

const hiddenEvents = computed(() => {
	return allGroups.value.slice(MAX_VISIBLE_EVENTS_PER_DAY).flat()
})

const totalEventsCount = computed(() => {
	return allGroups.value.reduce((total, group) => total + group.length, 0)
})

function handleMobileClick() {
	calendarStore.setSelectedDate(props.cell.date)
	calendarStore.setView("day" as TCalendarView)
}
</script>

<template>
	<div class="bg-card flex h-full flex-col overflow-hidden p-2.5" :class="containerClasses">
		<div class="flex h-8 w-full flex-shrink-0 items-center justify-center">
			<span
				class="flex size-6 items-center justify-center rounded-full text-xs font-medium"
				:class="dayClasses"
			>
				{{ cell.day }}
			</span>
		</div>

		<div
			class="flex flex-1 gap-1 overflow-hidden lg:flex-col lg:gap-1"
			:class="{ 'opacity-50': !isCurrentMonth }"
		>
			<div
				class="flex w-full cursor-pointer flex-wrap justify-center gap-1 lg:hidden"
				@click="handleMobileClick"
			>
				<span
					v-if="totalEventsCount > 0"
					class="bg-primary flex size-5 items-center justify-center rounded-full text-xs font-semibold"
				>
					{{ totalEventsCount }}
				</span>
			</div>

			<div class="hidden lg:flex lg:h-full lg:flex-col lg:gap-1 lg:overflow-hidden">
				<div
					v-for="(group, groupIndex) in displayGroups"
					:key="groupIndex"
					class="flex h-6 flex-shrink-0 gap-1"
				>
					<template v-if="group.length > 1">
						<Popover v-for="event in group" :key="event.id">
							<PopoverTrigger as-child>
								<BigCalendarMonthEventBadge
									:event="event"
									:cell-date="startOfDay(cell.date)"
									class="hide-time min-w-0 flex-1"
								/>
							</PopoverTrigger>
							<PopoverContent class="w-80">
								<BigCalendarEventPopover :event />
							</PopoverContent>
						</Popover>
					</template>

					<template v-else-if="group[0]">
						<Popover>
							<PopoverTrigger as-child>
								<BigCalendarMonthEventBadge
									:event="group[0]"
									:cell-date="startOfDay(cell.date)"
									class="w-full"
								/>
							</PopoverTrigger>
							<PopoverContent class="w-80">
								<BigCalendarEventPopover :event="group[0]" />
							</PopoverContent>
						</Popover>
					</template>
				</div>

				<div v-if="hasMoreEvents" class="flex h-6 flex-shrink-0 gap-1">
					<Popover>
						<PopoverTrigger as-child>
							<BigCalendarMonthEventBadge>
								<span class="flex-1 shrink-0 truncate">
									ще {{ remainingEventsCount }}
									{{ remainingEventsCount === 1 ? "заняття" : "занять" }}
								</span>
							</BigCalendarMonthEventBadge>
						</PopoverTrigger>
						<PopoverContent class="w-80">
							<BigCalendarMoreEventsPopover :events="hiddenEvents" :date="cell.date" />
						</PopoverContent>
					</Popover>
				</div>
			</div>
		</div>
	</div>
</template>
