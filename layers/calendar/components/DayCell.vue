<script setup lang="ts">
import { computed } from "vue"
import { isToday, startOfDay } from "date-fns"
import type { ICalendarCell, ICalendarEvent } from "../types"

interface Props {
	cell: ICalendarCell
	events: ICalendarEvent[]
	eventPositions: Record<string, number>
}

const props = defineProps<Props>()

const cellEvents = computed(() =>
	getMonthCellEvents(props.cell.date, props.events, props.eventPositions)
)

const isCurrentMonth = computed(() => props.cell.currentMonth)
const isDateToday = computed(() => isToday(props.cell.date))

const dayClasses = computed(() => ({
	"text-muted-foreground/50": !isCurrentMonth.value,
	"text-muted-foreground": isCurrentMonth.value && !isDateToday.value,
	"bg-primary": isDateToday.value,
}))

const containerClasses = computed(() => ({
	"opacity-50": !isCurrentMonth.value,
}))

function getEventForPosition(position: number) {
	return cellEvents.value.find((e) => e.position === position)
}
</script>

<template>
	<div class="bg-card flex flex-col gap-1 overflow-hidden p-2.5" :class="containerClasses">
		<div class="flex w-full items-center justify-center">
			<span
				class="mb-1 flex size-6 items-center justify-center rounded-full text-xs font-semibold"
				:class="dayClasses"
			>
				{{ cell.day }}
			</span>
		</div>

		<div
			class="flex h-6 gap-1 lg:min-h-[94px] lg:flex-col lg:gap-2"
			:class="{ 'opacity-50': !isCurrentMonth }"
		>
			<div
				v-for="position in [0, 1, 2]"
				:key="`position-${position}`"
				class="transition-all duration-200 lg:flex-1"
			>
				<template v-if="getEventForPosition(position)">
					<CalendarEventBullet class="lg:hidden" :type="getEventForPosition(position)!.type" />

					<CalendarMonthEventBadge
						class="hidden lg:flex"
						:event="getEventForPosition(position)!"
						:cell-date="startOfDay(cell.date)"
					/>
				</template>
			</div>
		</div>
	</div>
</template>
