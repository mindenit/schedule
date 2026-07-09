<script setup lang="ts">
import { format, isSameDay } from "date-fns"
import { uk } from "date-fns/locale"
import type { Schedule } from "nurekit"
import { CALENDAR_HOURS } from "~/constants/calendar"

interface Props {
	weekDays: Date[]
	groupedEventsByDay: Schedule[][][]
	tz: string
	/**
	 * Used to key EventRenderer instances so they remount on week changes.
	 * Pass the panel's anchor date timestamp.
	 */
	panelTime: number
	/**
	 * When false (incoming animation panel), EventBlock popovers and click
	 * handlers are suppressed. Markup stays pixel-identical to the live panel.
	 */
	interactive?: boolean
	/**
	 * Client-side "today" date to highlight the current day column header.
	 * null on SSR to avoid hydration mismatch.
	 */
	clientToday?: Date | null
	/**
	 * When true the Timeline is rendered inside the event grid.
	 * Only pass true on the current (interactive) panel.
	 */
	showTimeline?: boolean
}

withDefaults(defineProps<Props>(), {
	interactive: true,
	clientToday: null,
	showTimeline: false,
})

const { formatHour } = useEventFormatting()
const hours = CALENDAR_HOURS
</script>

<template>
	<div class="flex flex-1 flex-col lg:min-w-[800px]">
		<!-- Day-name + date-number header -->
		<div
			role="row"
			class="bg-muted/50 relative z-20 mb-1 grid grid-cols-[30px_1fr] gap-1 md:rounded-t-lg
				lg:grid-cols-[72px_1fr]"
		>
			<div class="col-start-2 grid grid-cols-7 gap-0.5 lg:gap-1">
				<div
					v-for="(day, index) in weekDays"
					:key="index"
					role="columnheader"
					:aria-label="capitalize(format(day, 'EEEE d MMMM', { locale: uk }))"
					class="text-muted-foreground flex flex-col items-center gap-0.5 py-1 text-center
						text-xs font-medium transition-colors duration-200 lg:min-w-[100px] lg:gap-1
						lg:py-2"
				>
					<!-- Mobile: single-letter initial (П В С Ч П С Н), sm: abbreviated, lg+: full name -->
					<span class="block text-[10px] sm:hidden">
						{{ capitalize(format(day, "EEEEE", { locale: uk })) }}
					</span>
					<span class="hidden sm:block lg:hidden">
						{{ capitalize(format(day, "EEE", { locale: uk })) }}
					</span>
					<span class="hidden lg:block">
						{{ capitalize(format(day, "EEEE", { locale: uk })) }}
					</span>
					<span
						class="flex size-4 items-center justify-center rounded-full text-[10px]
							font-semibold lg:size-5 lg:text-sm"
						:class="{
							'bg-primary text-foreground':
								clientToday && isSameDay(day, clientToday),
						}"
					>
						{{ format(day, "d") }}
					</span>
				</div>
			</div>
		</div>

		<!-- Hour gutter + event columns -->
		<div class="grid min-h-0 flex-1 grid-cols-[30px_1fr] gap-1 lg:grid-cols-[72px_1fr]">
			<!-- Hour gutter -->
			<div class="relative flex flex-col" role="presentation">
				<div
					v-for="(hour, index) in hours"
					:key="hour"
					class="bg-muted/50 relative flex-1"
					:class="{ 'rounded-bl-lg': index === hours.length - 1 }"
				>
					<div class="absolute -top-3 right-0.5 flex h-6 items-center lg:right-2">
						<span
							v-if="index !== 0"
							class="text-muted-foreground text-[10px] whitespace-nowrap lg:text-xs"
						>
							{{ formatHour(hour) }}
						</span>
					</div>
				</div>
			</div>

			<!-- 7 day columns -->
			<div class="relative min-h-0 flex-1">
				<div role="grid" class="grid h-full grid-cols-7 gap-0.5 lg:gap-1">
					<div
						v-for="(day, dayIndex) in weekDays"
						:key="day.getTime()"
						role="gridcell"
						:aria-label="format(day, 'd MMMM', { locale: uk })"
						class="relative lg:min-w-[100px]"
					>
						<div class="flex h-full flex-col gap-1">
							<div
								v-for="(hour, hourIndex) in hours"
								:key="hour"
								class="bg-card relative flex-1"
								:class="{
									'rounded-br-lg':
										dayIndex === weekDays.length - 1 &&
										hourIndex === hours.length - 1,
								}"
							/>
						</div>
						<BigCalendarEventRenderer
							:key="`${panelTime}-${dayIndex}`"
							:grouped-events="groupedEventsByDay[dayIndex] ?? []"
							:day="day"
							:tz="tz"
							:interactive="interactive"
						/>
					</div>
				</div>
				<BigCalendarTimeline v-if="showTimeline" :week-days="weekDays" />
			</div>
		</div>
	</div>
</template>
