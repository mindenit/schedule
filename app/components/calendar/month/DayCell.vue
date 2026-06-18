<script setup lang="ts">
import { isToday, startOfDay } from "date-fns"
import type { Schedule } from "nurekit"
import { MAX_VISIBLE_EVENTS_PER_DAY } from "~/constants/calendar"
import type { ICalendarCell, TCalendarView } from "~/types/calendar"

interface Props {
	cell: ICalendarCell
	// Pre-filtered to this cell's date by MonthView — no need to scan the full event array.
	dayEvents: Schedule[]
	eventPositions: Record<string, number>
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { groupEventsBySameTime } = useEventGrouping()

// Group same-time events — input is already filtered to this day.
const groupedCellEvents = computed(() => groupEventsBySameTime(props.dayEvents))

const isCurrentMonth = computed(() => props.cell.currentMonth)
const isDateToday = computed(() => isToday(props.cell.date))

const dayClasses = computed(() => ({
	"text-muted-foreground/50": !isCurrentMonth.value,
	"text-muted-foreground": isCurrentMonth.value && !isDateToday.value,
	"bg-primary ": isDateToday.value && isCurrentMonth.value,
}))

const containerClasses = computed(() => ({
	"opacity-80": !isCurrentMonth.value,
}))

// Single computed for all display-related derived values — evaluates groupedCellEvents once.
const cellDisplay = computed(() => {
	const groups = groupedCellEvents.value
	const total = groups.length

	const hiddenCount =
		total > MAX_VISIBLE_EVENTS_PER_DAY
			? groups
					.slice(MAX_VISIBLE_EVENTS_PER_DAY)
					.reduce((n, g) => n + g.length, 0)
			: 0
	const onlyOneHidden = hiddenCount === 1
	const hasMoreEvents = total > MAX_VISIBLE_EVENTS_PER_DAY && !onlyOneHidden
	const maxVisible = onlyOneHidden ? MAX_VISIBLE_EVENTS_PER_DAY + 1 : MAX_VISIBLE_EVENTS_PER_DAY

	return {
		displayGroups: groups.slice(0, maxVisible),
		hasMoreEvents,
		remainingEventsCount: hasMoreEvents ? hiddenCount : 0,
		hiddenEvents: groups.slice(MAX_VISIBLE_EVENTS_PER_DAY).flat(),
		totalEventsCount: groups.reduce((n, g) => n + g.length, 0),
	}
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
					v-if="cellDisplay.totalEventsCount > 0"
					class="bg-primary flex size-5 items-center justify-center rounded-full text-xs
						font-semibold"
				>
					{{ cellDisplay.totalEventsCount }}
				</span>
			</div>

			<div class="hidden lg:flex lg:h-full lg:flex-col lg:gap-1 lg:overflow-hidden">
				<div
					v-for="(group, groupIndex) in cellDisplay.displayGroups"
					:key="groupIndex"
					class="flex h-6 flex-shrink-0 gap-1"
				>
					<template v-if="group.length > 1">
						<UiPopover v-for="event in group" :key="event.id">
							<UiPopoverTrigger as-child>
								<BigCalendarMonthEventBadge
									:event="event"
									:cell-date="startOfDay(cell.date)"
									class="hide-time min-w-0 flex-1"
								/>
							</UiPopoverTrigger>
							<UiPopoverContent class="w-80">
								<BigCalendarEventPopover :event />
							</UiPopoverContent>
						</UiPopover>
					</template>

					<template v-else-if="group[0]">
						<UiPopover>
							<UiPopoverTrigger as-child>
								<BigCalendarMonthEventBadge
									:event="group[0]"
									:cell-date="startOfDay(cell.date)"
									class="w-full"
								/>
							</UiPopoverTrigger>
							<UiPopoverContent class="w-80">
								<BigCalendarEventPopover :event="group[0]" />
							</UiPopoverContent>
						</UiPopover>
					</template>
				</div>

				<div v-if="cellDisplay.hasMoreEvents" class="flex h-6 flex-shrink-0 gap-1">
					<UiPopover>
						<UiPopoverTrigger as-child>
							<BigCalendarMonthEventBadge>
								<span class="flex-1 shrink-0 truncate">
									ще {{ cellDisplay.remainingEventsCount }}
									{{ cellDisplay.remainingEventsCount === 1 ? "заняття" : "занять" }}
								</span>
							</BigCalendarMonthEventBadge>
						</UiPopoverTrigger>
						<UiPopoverContent class="w-80">
							<BigCalendarMoreEventsPopover
								:events="cellDisplay.hiddenEvents"
								:date="cell.date"
							/>
						</UiPopoverContent>
					</UiPopover>
				</div>
			</div>
		</div>
	</div>
</template>
