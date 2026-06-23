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
	return !props.hasActiveSchedule || props.isLoading || !!props.error
})

const overlayContent = computed(() => {
	if (!props.hasActiveSchedule) return "no-schedule"
	if (props.isLoading) return "loading"
	if (props.error) return "error"
	return null
})
</script>

<template>
	<div
		class="hide-scrollbar relative flex h-full flex-col overflow-x-hidden rounded-lg
			max-md:rounded-t-none"
	>
		<div
			class="min-h-0 flex-1 transition-all duration-300 ease-in-out"
			:class="{ 'blur-sm': showOverlay }"
		>
			<NuxtErrorBoundary @error="(err) => console.error('[Calendar] render error:', err)">
				<BigCalendarYearView v-if="view === 'year'" :events="props.events" class="h-full" />
				<BigCalendarMonthView
					v-else-if="view === 'month'"
					:events="props.events"
					class="h-full overflow-y-hidden"
				/>
				<BigCalendarWeekView v-else-if="view === 'week'" :events="props.events" class="h-full" />
				<BigCalendarDayView v-else-if="view === 'day'" :events="props.events" class="h-full" />

				<template #error="{ error: renderError, clearError }">
					<div class="flex h-full items-center justify-center p-4">
						<UiAlert variant="destructive" class="mx-2 w-sm">
							<UiAlertTitle>Помилка відображення календаря</UiAlertTitle>
							<UiAlertDescription>
								<p class="mb-3">
									{{
										renderError?.message ||
										"Виникла непередбачена помилка при рендерингу календаря."
									}}
								</p>
								<UiButton size="sm" variant="outline" @click="clearError">Спробувати знову</UiButton>
							</UiAlertDescription>
						</UiAlert>
					</div>
				</template>
			</NuxtErrorBoundary>
		</div>

		<ClientOnly>
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
					class="bg-background/70 pointer-events-none absolute inset-0 flex items-center
						justify-center backdrop-blur-sm"
				>
					<AppEmptyState
						v-if="overlayContent === 'no-schedule'"
						variant="card"
						icon="lucide:alert-circle"
						title="Розклад не обрано"
						description="Оберіть або додайте розклад"
						class="pointer-events-auto"
					/>

					<TheLoader v-else-if="overlayContent === 'loading'" size="lg" class="pointer-events-auto" />

					<UiAlert v-else-if="overlayContent === 'error'" variant="destructive" class="pointer-events-auto mx-2 w-sm">
						<UiAlertTitle>Помилка</UiAlertTitle>
						<UiAlertDescription>
							<p v-if="error">Не вдалося завантажити розклад: {{ error.message }}</p>
							<p v-else>Виникла невідома помилка при завантаженні розкладу.</p>
						</UiAlertDescription>
					</UiAlert>
				</div>
			</Transition>
		</ClientOnly>
	</div>
</template>
