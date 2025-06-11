<script setup lang="ts">
import { isToday, startOfDay, parseISO, isSameDay } from "date-fns"

interface Props {
	cell: ICalendarCell
	events: ICalendarEvent[]
	eventPositions: Record<string, number>
}

const props = defineProps<Props>()

function groupEventsBySameTime(events: ICalendarEvent[]): ICalendarEvent[][] {
	const timeGroups = new Map<string, ICalendarEvent[]>()

	events.forEach((event) => {
		const timeKey = `${event.startDate}-${event.endDate}`

		if (!timeGroups.has(timeKey)) {
			timeGroups.set(timeKey, [])
		}
		timeGroups.get(timeKey)!.push(event)
	})

	return Array.from(timeGroups.values()).sort(
		(a, b) => parseISO(a[0]!.startDate).getTime() - parseISO(b[0]!.startDate).getTime()
	)
}

const groupedCellEvents = computed(() => {
	const eventsForDate = props.events.filter((event) => {
		const eventStart = startOfDay(parseISO(event.startDate))
		return isSameDay(eventStart, startOfDay(props.cell.date))
	})

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
const displayGroups = computed(() => allGroups.value.slice(0, 2))
const hasMoreEvents = computed(() => allGroups.value.length > 2)
const remainingEventsCount = computed(() => {
	if (!hasMoreEvents.value) return 0
	return allGroups.value.slice(2).reduce((total, group) => total + group.length, 0)
})
</script>

<template>
	<div class="bg-card flex flex-col gap-1 overflow-hidden p-2.5" :class="containerClasses">
		<div class="flex w-full items-center justify-center">
			<span
				class="mb-1 flex size-6 items-center justify-center rounded-full text-xs font-medium"
				:class="dayClasses"
			>
				{{ cell.day }}
			</span>
		</div>

		<div
			class="flex h-6 gap-1 lg:min-h-[94px] lg:flex-col lg:gap-2"
			:class="{ 'opacity-50': !isCurrentMonth }"
		>
			<div class="flex flex-wrap gap-1 lg:hidden">
				<span
					v-if="displayGroups.length > 0"
					class="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full text-xs
						font-semibold"
				>
					{{ allGroups.reduce((total, group) => total + group.length, 0) }}
				</span>
			</div>

			<div class="hidden lg:flex lg:flex-1 lg:flex-col lg:gap-1">
				<div
					v-for="(group, groupIndex) in displayGroups"
					:key="groupIndex"
					class="flex min-h-0 gap-1"
				>
					<template v-if="group.length > 1">
						<CalendarMonthEventBadge
							v-for="event in group"
							:key="event.id"
							:event="event"
							:cell-date="startOfDay(cell.date)"
							class="hide-time min-w-0 flex-1"
						/>
					</template>

					<CalendarMonthEventBadge
						v-else-if="group[0]"
						:event="group[0]"
						:cell-date="startOfDay(cell.date)"
						class="w-full"
					/>
				</div>
				<div v-if="hasMoreEvents" class="last-group flex min-h-0 gap-1">
					<CalendarMonthEventBadge>
						<span class="flex-1 shrink-0 truncate">
							ще {{ remainingEventsCount }} {{ remainingEventsCount === 1 ? "заняття" : "занять" }}
						</span>
					</CalendarMonthEventBadge>
				</div>
			</div>
		</div>
	</div>
</template>
