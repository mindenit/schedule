<script setup lang="ts">
import type { Schedule } from "nurekit"
import { storeToRefs } from "pinia"

interface Props {
	events: Schedule[]
	hasActiveSchedule: boolean
	isLoading: boolean
	error: Error | null
	scheduleName?: string
}

const props = defineProps<Props>()

const calendarStore = useCalendarStore()
const { view } = storeToRefs(calendarStore)

const showOverlay = computed(() => {
	return !props.hasActiveSchedule || props.isLoading || props.error
})
</script>

<template>
	<div class="relative size-full overflow-hidden rounded-lg">
		<div :class="{ 'blur-sm': showOverlay }">
			<CalendarMonthView v-if="view === 'month'" :events="props.events" />
			<CalendarWeekView v-else-if="view === 'week'" :events="props.events" />
			<CalendarDayView v-else-if="view === 'day'" :events="props.events" />
		</div>

		<div
			v-if="!hasActiveSchedule"
			class="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm"
		>
			<div v-if="!hasActiveSchedule" class="border-border bg-card rounded-lg border p-6 shadow-lg">
				<div class="flex items-center">
					<Icon name="lucide:alert-circle" class="flex-shrink-0" />
					<div class="ml-4">
						<h3 class="text-lg font-semibold">Розклад не обрано</h3>
						<div class="text-sm">
							<p>Оберіть або додайте розклад</p>
						</div>
					</div>
				</div>
			</div>

			<TheLoader v-if="isLoading" size="lg" />

			<Alert v-if="error" variant="destructive" class="mx-2 w-sm">
				<AlertTitle>Помилка</AlertTitle>
				<AlertDescription>
					<p v-if="error">Не вдалося завантажити розклад: {{ error.message }}</p>
					<p v-else>Виникла невідома помилка при завантаженні розкладу.</p>
				</AlertDescription>
			</Alert>
		</div>
	</div>
</template>
