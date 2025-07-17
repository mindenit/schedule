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
const { view, isInitialized } = storeToRefs(calendarStore)

if (import.meta.client) {
	calendarStore.initializeStore()
}

const showOverlay = computed(() => {
	return !isInitialized.value || !props.hasActiveSchedule || props.isLoading || props.error
})

const overlayContent = computed(() => {
	if (!isInitialized.value) {
		return "initializing"
	}
	if (!props.hasActiveSchedule) {
		return "no-schedule"
	}
	if (props.isLoading) {
		return "loading"
	}
	if (props.error) {
		return "error"
	}
	return null
})
</script>

<template>
	<div class="relative flex h-full flex-col overflow-x-hidden rounded-lg max-md:rounded-t-none">
		<div class="flex-1 transition-all duration-300 ease-in-out" :class="{ 'blur-sm': showOverlay }">
			<BigCalendarMonthView
				v-if="view === 'month'"
				:events="props.events"
				class="h-full overflow-y-hidden"
			/>
			<BigCalendarWeekView v-else-if="view === 'week'" :events="props.events" class="h-full" />
			<BigCalendarDayView v-else-if="view === 'day'" :events="props.events" class="h-full" />
		</div>

		<Transition
			enter-active-class="transition-all duration-300 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-all duration-200 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="showOverlay"
				class="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm"
			>
				<TheLoader v-if="overlayContent === 'initializing'" size="lg" />

				<div
					v-else-if="overlayContent === 'no-schedule'"
					class="border-border bg-card rounded-lg border p-6 shadow-lg"
				>
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

				<TheLoader v-else-if="overlayContent === 'loading'" size="lg" />

				<Alert v-else-if="overlayContent === 'error'" variant="destructive" class="mx-2 w-sm">
					<AlertTitle>Помилка</AlertTitle>
					<AlertDescription>
						<p v-if="error">Не вдалося завантажити розклад: {{ error.message }}</p>
						<p v-else>Виникла невідома помилка при завантаженні розкладу.</p>
					</AlertDescription>
				</Alert>
			</div>
		</Transition>
	</div>
</template>
