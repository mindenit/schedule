<script lang="ts" setup>
interface Props {
	variant?: "banner" | "card"
}

withDefaults(defineProps<Props>(), { variant: "banner" })

const scheduleStore = useScheduleStore()
const { isEphemeralActive, selectedSchedule } = storeToRefs(scheduleStore)
const { trackEvent } = useAnalytics()

// Dismissed flag is session-scoped: persists across navigations within the same
// tab but resets on a fresh page load — so a new shared URL always shows the banner.
const isDismissed = useSessionStorage("ephemeral-banner-dismissed", false)

const isVisible = computed(() => isEphemeralActive.value && !isDismissed.value)

// Reset dismissed state whenever a new ephemeral schedule is loaded
// (user opens a different shared link in the same tab).
watch(
	() => selectedSchedule.value?.id,
	() => {
		isDismissed.value = false
	}
)

function save() {
	if (!selectedSchedule.value) return
	scheduleStore.addSchedule(selectedSchedule.value)
	trackEvent("schedule_added", { type: selectedSchedule.value.type })
}

function dismiss() {
	isDismissed.value = true
}
</script>

<template>
	<Transition
		enter-active-class="transition-[transform,opacity] duration-300 ease-out"
		enter-from-class="-translate-y-2 opacity-0"
		enter-to-class="translate-y-0 opacity-100"
		leave-active-class="transition-[transform,opacity] duration-200 ease-in"
		leave-from-class="translate-y-0 opacity-100"
		leave-to-class="-translate-y-2 opacity-0"
	>
		<!-- Desktop sidebar card -->
		<UiAlert
			v-if="isVisible && variant === 'card'"
			variant="warning"
			class="flex-col items-start gap-2"
		>
			<div class="flex w-full flex-col gap-0.5">
				<UiAlertTitle class="flex items-center gap-1.5">
					<Icon name="lucide:link" class="size-4 shrink-0" aria-hidden="true" />
					{{ selectedSchedule?.name }}
				</UiAlertTitle>
				<UiAlertDescription>
					Відкрито за посиланням — не збережено до вашого списку
				</UiAlertDescription>
			</div>
			<div class="mt-1 flex gap-2">
				<UiButton size="sm" class="h-7 text-xs" @click="save">Зберегти до списку</UiButton>
				<UiButton size="sm" variant="ghost" class="h-7 text-xs" @click="dismiss">
					Не зберігати
				</UiButton>
			</div>
		</UiAlert>

		<!-- Mobile top banner -->
		<div
			v-else-if="isVisible && variant === 'banner'"
			class="bg-muted border-border flex items-center gap-3 border-b px-4 py-2 text-sm"
			role="status"
		>
			<Icon name="lucide:link" class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
			<span class="min-w-0 flex-1 leading-tight">
				<strong class="text-foreground block truncate">{{ selectedSchedule?.name }}</strong>
				<span class="text-muted-foreground text-xs">не збережено до списку</span>
			</span>
			<UiButton size="sm" class="h-7 shrink-0 text-xs" @click="save">Зберегти</UiButton>
			<UiButton
				size="icon"
				variant="ghost"
				class="text-muted-foreground hover:text-foreground size-7 shrink-0"
				aria-label="Закрити"
				@click="dismiss"
			>
				<Icon name="lucide:x" class="size-3.5" aria-hidden="true" />
			</UiButton>
		</div>
	</Transition>
</template>
