<script setup lang="ts">
interface Props {
	variant: "sidebar" | "fab"
}

defineProps<Props>()

const isDialogOpen = useState("schedule:add-dialog:open", () => false)
</script>

<template>
	<UiButton
		v-if="variant === 'sidebar'"
		class="min-w-0 flex-1 gap-1"
		@click="isDialogOpen = true"
	>
		<AppIcon name="lucide:plus" /> Додати розклад
	</UiButton>

	<UiButton
		v-else
		class="size-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
		size="icon"
		aria-label="Додати розклад"
		@click="isDialogOpen = true"
	>
		<AppIcon name="lucide:plus" size="lg" />
	</UiButton>
</template>
