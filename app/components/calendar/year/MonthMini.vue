<script setup lang="ts">
/**
 * MonthMini — a compact month calendar used in the Year view.
 *
 * All per-cell derived values (isToday, colorClass, isThisMonth) are
 * pre-baked by YearView.buildMonthMini so this component does zero
 * date-fns or Map calls at render time.
 */

interface MonthMiniCell {
	date: Date
	currentMonth: boolean
	/** Pre-baked by buildMonthMini — avoids date-fns isToday() per cell. */
	isToday: boolean
	/** Pre-baked dominant event-type color class, or undefined when no events. */
	colorClass: string | undefined
}

interface MonthMiniData {
	label: string
	date: Date
	/** Pre-baked by buildMonthMini — avoids isThisMonth(date) ×2 per render. */
	isThisMonth: boolean
	cells: MonthMiniCell[]
}

interface Props {
	month: MonthMiniData
}

defineProps<Props>()

const emit = defineEmits<{
	dayClick: [date: Date]
	monthClick: [date: Date]
}>()

// Week day initials (М П С Ч П С Н) — Mon-first
const WEEK_INITIALS = ["М", "П", "С", "Ч", "П", "С", "Н"]
</script>

<template>
	<!--
		transition-colors removed (D): colors never change during a swipe animation —
		they were pre-baked — so the CSS transition only added mount overhead with zero
		visible benefit during navigation.
	-->
	<div
		class="flex flex-col rounded-lg p-1.5 lg:min-h-0 lg:p-2"
		:class="[month.isThisMonth ? 'bg-primary/8 ring-primary/30 ring-1' : 'bg-muted/30']"
	>
		<!-- Month header — click to navigate to month view -->
		<button
			class="mb-1 cursor-pointer text-left font-semibold capitalize text-[10px] leading-tight lg:text-xs"
			:class="[
				month.isThisMonth
					? 'text-primary hover:text-primary/80'
					: 'text-foreground hover:text-primary',
			]"
			@click="emit('monthClick', month.date)"
		>
			{{ month.label }}
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
				v-for="(cell, i) in month.cells"
				:key="i"
				class="group flex items-center justify-center"
				:class="[cell.currentMonth ? 'cursor-pointer' : 'pointer-events-none opacity-0']"
				:disabled="!cell.currentMonth"
				@click="cell.currentMonth && emit('dayClick', cell.date)"
			>
				<!--
					Mobile: 14px dot with day number visible.
					lg+: 18px dot with full hover interactions.
				-->
				<span
					class="flex aspect-square items-center justify-center rounded-full
						w-[14px] text-[7px] font-medium
						lg:w-full lg:max-w-[18px] lg:rounded-sm lg:text-[9px]
						lg:group-hover:ring-1 lg:group-hover:ring-offset-0"
					:class="[
						cell.isToday
							? 'bg-primary text-primary-foreground lg:group-hover:ring-primary/40'
							: cell.colorClass
								? [cell.colorClass, 'text-white lg:group-hover:ring-white/30']
								: 'text-muted-foreground lg:group-hover:bg-muted lg:group-hover:ring-border',
					]"
				>
					{{ cell.date.getDate() }}
				</span>
			</button>
		</div>
	</div>
</template>
