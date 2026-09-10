<script setup lang="ts">
interface Props {
	variant: "sidebar" | "fab"
}

defineProps<Props>()

const isDialogOpen = useState(DIALOG_KEYS.scheduleAdd, () => false)
</script>

<template>
	<UiButton
		v-if="variant === 'sidebar'"
		class="min-w-0 flex-1 gap-1"
		@click="isDialogOpen = true"
	>
		<AppIcon name="ph:plus-bold" /> Додати розклад
	</UiButton>

	<UiButton
		v-else
		class="size-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
		size="icon"
		aria-label="Додати розклад"
		@click="isDialogOpen = true"
	>
		<AppIcon name="ph:plus-bold" size="lg" />
	</UiButton>
</template>
