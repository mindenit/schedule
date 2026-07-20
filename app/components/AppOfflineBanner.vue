<script lang="ts" setup>
const isOnline = useOnline()
const wasOffline = ref(false)
const showReconnected = ref(false)

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
			<span>Без з'єднання — показано збережені дані</span>
		</div>
	</Transition>
</template>
