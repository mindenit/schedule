<script setup lang="ts">
import type { Schedule } from "@mindenit/nurekit"
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
const { trackEvent } = useAnalytics()
const isAddDialogOpen = useState("schedule:add-dialog:open", () => false)

// SSR renders the calendar with no localStorage access, so hasActiveSchedule is
// always false on the server. This causes a hydration mismatch on blur-sm and the
// overlay content. Fix: treat every render as "loading" until onMounted fires —
// SSR, client hydration, and the first client frame all agree on the same state
// (blurred grid + spinner). After mount the real prop values take over.
const isHydrating = ref(true)
onMounted(() => {
	isHydrating.value = false
})

// Aria-live announcement for screen readers: announces schedule load result.
// Debounced so rapid filter toggles (which cycle isLoading) don't spam.
const announcement = ref("")
let _announceTimer: ReturnType<typeof setTimeout> | null = null

watch(
	[() => props.isLoading, () => props.error, () => props.events.length],
	([loading, err, count], [wasLoading]) => {
		if (isHydrating.value) return
		// Only announce when a loading cycle completes (wasLoading → not loading).
		if (!wasLoading) return
		if (loading) return

		if (_announceTimer) clearTimeout(_announceTimer)
		_announceTimer = setTimeout(() => {
			if (err) {
				announcement.value = "Не вдалося оновити розклад"
			} else if (props.hasActiveSchedule) {
				announcement.value = `Розклад оновлено, ${count} ${pluralUk(count, "подія", "події", "подій")}`
			}
		}, 500)
	}
)

const showOverlay = computed(() => {
	if (isHydrating.value) return true
	return !props.hasActiveSchedule || props.isLoading || !!props.error
})

const overlayContent = computed(() => {
	if (isHydrating.value) return "loading"
	if (!props.hasActiveSchedule) return "no-schedule"
	if (props.isLoading) return "loading"
	if (props.error) return "error"
	return null
})
</script>

<template>
	<!-- Aria-live region: announces schedule load results to screen readers. -->
	<!-- sr-only keeps it invisible; role=status + aria-live=polite avoids interrupting speech. -->
	<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
		{{ announcement }}
	</div>

	<div
		class="hide-scrollbar relative flex h-full flex-col overflow-x-hidden rounded-lg
			max-md:rounded-t-none"
	>
		<div
			class="min-h-0 flex-1 transition-[opacity,filter] duration-300 ease-in-out"
			:class="{ 'blur-sm': showOverlay }"
		>
			<NuxtErrorBoundary
				@error="
					(err) => {
						console.error('[Calendar] render error:', err)
						trackEvent('app_error', { status: 0, source: 'calendar' })
						useSonner.error('Помилка відображення', {
							description: err?.message || 'Не вдалося відрендерити календар',
						})
					}
				"
			>
				<BigCalendarYearView v-if="view === 'year'" :events="props.events" class="h-full" />
				<BigCalendarMonthView
					v-else-if="view === 'month'"
					:events="props.events"
					class="h-full overflow-y-hidden"
				/>
				<BigCalendarWeekView
					v-else-if="view === 'week'"
					:events="props.events"
					class="h-full"
				/>
				<BigCalendarDayView
					v-else-if="view === 'day'"
					:events="props.events"
					class="h-full"
				/>

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
								<UiButton size="sm" variant="outline" @click="clearError"
									>Спробувати знову</UiButton
								>
							</UiAlertDescription>
						</UiAlert>
					</div>
				</template>
			</NuxtErrorBoundary>
		</div>

		<Transition
			enter-active-class="transition-opacity duration-300 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity duration-200 ease-in"
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
				>
					<template #actions>
						<UiButton size="sm" @click="isAddDialogOpen = true">
							<AppIcon name="lucide:plus" />
							Додати розклад
						</UiButton>
					</template>
				</AppEmptyState>

				<TheLoader
					v-else-if="overlayContent === 'loading'"
					size="lg"
					class="pointer-events-auto"
				/>

				<UiAlert
					v-else-if="overlayContent === 'error'"
					variant="destructive"
					class="pointer-events-auto mx-2 w-sm"
				>
					<UiAlertTitle>Помилка</UiAlertTitle>
					<UiAlertDescription>
						<p v-if="error">Не вдалося завантажити розклад: {{ error.message }}</p>
						<p v-else>Виникла невідома помилка при завантаженні розкладу.</p>
					</UiAlertDescription>
				</UiAlert>
			</div>
		</Transition>
	</div>
</template>
