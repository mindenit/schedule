<script setup lang="ts">
const isOnline = useOnline()
const wasOffline = ref(false)
const showReconnected = ref(false)

const calendarStore = useCalendarStore()
const { lastUpdatedAt } = storeToRefs(calendarStore)
const { tzFormat } = useTimezone()

const lastFetchTime = computed(() =>
	lastUpdatedAt.value > 0 ? tzFormat(new Date(lastUpdatedAt.value), "HH:mm") : null
)

watch(isOnline, (online) => {
	if (!online) {
		wasOffline.value = true
		showReconnected.value = false
	} else if (wasOffline.value) {
		showReconnected.value = true
		setTimeout(() => {
			showReconnected.value = false
			wasOffline.value = false
		}, 3000)
	}
})
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
		<div
			v-if="!isOnline"
			class="bg-warning/15 text-warning-foreground border-warning/30 flex items-center
				justify-center gap-2 border-b px-4 py-2 text-sm font-medium"
			role="alert"
			aria-live="assertive"
		>
			<AppIcon name="lucide:wifi-off" class="shrink-0" aria-hidden="true" />
			<span>
				Без з'єднання —
				<template v-if="lastFetchTime">дані від {{ lastFetchTime }}</template>
				<template v-else>показано збережені дані</template>
			</span>
		</div>
	</Transition>
</template>
