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
	/**
	 * When false (incoming panel during slide animation), interactive affordances
	 * are stripped: month header and day cells render as plain divs/spans,
	 * @click emits are suppressed, hover ring classes are omitted.
	 * Markup and sizing stay pixel-identical to the live mini. Defaults to true.
	 */
	interactive?: boolean
}

withDefaults(defineProps<Props>(), { interactive: true })

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
		<!-- Month header — click to navigate to month view (interactive only) -->
		<component
			:is="interactive ? 'button' : 'span'"
			class="mb-1 text-left text-[10px] leading-tight font-semibold capitalize lg:text-xs"
			:class="[
				interactive ? 'cursor-pointer' : '',
				month.isThisMonth
					? interactive
						? 'text-primary hover:text-primary/80'
						: 'text-primary'
					: interactive
						? 'text-foreground hover:text-primary'
						: 'text-foreground',
			]"
			@click="interactive && emit('monthClick', month.date)"
		>
			{{ month.label }}
		</component>

		<!-- Week day initials header — hidden on mobile, visible on lg+ -->
		<div class="mb-0.5 hidden grid-cols-7 lg:grid">
			<span
				v-for="initial in WEEK_INITIALS"
				:key="initial"
				class="text-muted-foreground flex items-center justify-center text-[9px]
					leading-none font-medium"
			>
				{{ initial }}
			</span>
		</div>

		<!-- Day cells grid -->
		<div class="grid grid-cols-7 gap-[2px] lg:min-h-0 lg:flex-1">
			<component
				:is="interactive ? 'button' : 'div'"
				v-for="(cell, i) in month.cells"
				:key="i"
				class="group flex items-center justify-center"
				:class="[
					!cell.currentMonth
						? 'pointer-events-none opacity-0'
						: interactive
							? 'cursor-pointer'
							: '',
				]"
				:disabled="interactive && !cell.currentMonth ? true : undefined"
				@click="interactive && cell.currentMonth && emit('dayClick', cell.date)"
			>
				<span
					class="flex aspect-square w-[14px] items-center justify-center rounded-full
						text-[7px] font-medium lg:w-full lg:max-w-[18px] lg:rounded-sm
						lg:text-[9px]"
					:class="[
						interactive ? 'lg:group-hover:ring-1 lg:group-hover:ring-offset-0' : '',
						cell.isToday
							? [
									'bg-primary text-primary-foreground',
									interactive ? 'lg:group-hover:ring-primary/40' : '',
								]
							: cell.colorClass
								? [
										cell.colorClass,
										'text-white',
										interactive ? 'lg:group-hover:ring-white/30' : '',
									]
								: [
										'text-muted-foreground',
										interactive
											? 'lg:group-hover:bg-muted lg:group-hover:ring-border'
											: '',
									],
					]"
				>
					{{ cell.date.getDate() }}
				</span>
			</component>
		</div>
	</div>
</template>
