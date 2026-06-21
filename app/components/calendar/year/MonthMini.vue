<script setup lang="ts">
import { isToday, isThisMonth } from "date-fns"

interface MonthMiniData {
	label: string
	date: Date
	cells: { date: Date; currentMonth: boolean }[]
}

interface Props {
	month: MonthMiniData
	/** Pre-computed map: day timestamp → dominant event-type bg class. Only days with events are present. */
	colorByDayKey: Map<number, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
	dayClick: [date: Date]
	monthClick: [date: Date]
}>()

// Week day initials (М П С Ч П С Н) — Mon-first
const WEEK_INITIALS = ["М", "П", "С", "Ч", "П", "С", "Н"]
</script>

<template>
	<div
		class="flex flex-col rounded-lg p-1.5 transition-colors lg:min-h-0 lg:p-2"
		:class="[
			isThisMonth(props.month.date)
				? 'bg-primary/8 ring-primary/30 ring-1'
				: 'bg-muted/30',
		]"
	>
		<!-- Month header — click to navigate to month view -->
		<button
			class="mb-1 cursor-pointer text-left font-semibold capitalize transition-colors
				text-[10px] leading-tight lg:text-xs"
			:class="[
				isThisMonth(props.month.date)
					? 'text-primary hover:text-primary/80'
					: 'text-foreground hover:text-primary',
			]"
			@click="emit('monthClick', props.month.date)"
		>
			{{ props.month.label }}
		</button>

		<!-- Week day initials header — hidden on mobile, visible on lg+ -->
		<div class="mb-0.5 hidden grid-cols-7 lg:grid">
			<span
				v-for="initial in WEEK_INITIALS"
				:key="initial"
				class="text-muted-foreground flex items-center justify-center text-[9px] font-medium leading-none"
			>
				{{ initial }}
			</span>
		</div>

		<!-- Day cells grid -->
		<div class="grid grid-cols-7 gap-[2px] lg:min-h-0 lg:flex-1">
			<button
				v-for="(cell, i) in props.month.cells"
				:key="i"
				class="group flex items-center justify-center"
				:class="[cell.currentMonth ? 'cursor-pointer' : 'pointer-events-none opacity-0']"
				:disabled="!cell.currentMonth"
				@click="cell.currentMonth && emit('dayClick', cell.date)"
			>
				<!--
					Mobile: 14px dot with day number visible. No hover ring to keep it clean.
					lg+: 18px dot with full hover interactions.
				-->
				<span
					class="flex aspect-square items-center justify-center rounded-full transition-colors
						w-[14px] text-[7px] font-medium
						lg:w-full lg:max-w-[18px] lg:rounded-sm lg:text-[9px]
						lg:group-hover:ring-1 lg:group-hover:ring-offset-0"
					:class="[
						isToday(cell.date)
							? 'bg-primary text-primary-foreground lg:group-hover:ring-primary/40'
							: colorByDayKey.get(cell.date.getTime())
								? [colorByDayKey.get(cell.date.getTime()), 'text-white lg:group-hover:ring-white/30']
								: 'text-muted-foreground lg:group-hover:bg-muted lg:group-hover:ring-border',
					]"
				>
					{{ cell.date.getDate() }}
				</span>
			</button>
		</div>
	</div>
</template>
