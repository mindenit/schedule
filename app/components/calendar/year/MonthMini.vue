<script setup lang="ts">
/**
 * MonthMini — a compact month calendar used in the Year view.
 *
 * colorClass and isThisMonth are pre-baked by YearView.buildMonthMini so this
 * component avoids Map lookups at render time.
 *
 * isToday is intentionally NOT pre-baked (see YearView.vue for rationale).
 * Instead, todayKey (Unix ms of today's midnight) is passed as a prop from
 * YearView and compared per-cell inline: O(1) integer comparison, same perf.
 * null = not yet mounted (SSR / hydration) → no cell is highlighted as today,
 * which exactly matches the SSR output and prevents a hydration mismatch.
 */

interface MonthMiniCell {
	date: Date
	currentMonth: boolean
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
	 * Unix ms of today's midnight in local JS time. null before onMounted so
	 * both SSR and the initial client frame agree (no cell marked as today yet).
	 */
	todayKey: number | null
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
			class="mb-1 text-left text-[0.625rem] leading-tight font-semibold capitalize lg:text-xs"
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
				class="text-muted-foreground flex items-center justify-center text-[0.625rem]
					leading-none font-medium"
			>
				{{ initial }}
			</span>
		</div>

		<!-- Day cells grid -->
		<div class="grid grid-cols-7 gap-0.5 lg:min-h-0 lg:flex-1">
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
					class="flex aspect-square w-3.5 items-center justify-center rounded-full
						text-[0.438rem] font-medium lg:w-full lg:max-w-4.5 lg:rounded-sm
						lg:text-[0.563rem]"
					:class="[
						interactive ? 'lg:group-hover:ring-1 lg:group-hover:ring-offset-0' : '',
						todayKey !== null && cell.date.getTime() === todayKey
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
