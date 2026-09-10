<script setup lang="ts">
interface Props {
	label: string
	isActive: boolean
}

defineProps<Props>()

const emit = defineEmits<{
	toggle: []
}>()
</script>

<template>
	<UiButton
		:variant="isActive ? 'default' : 'outline'"
		size="sm"
		class="text-xs"
		@click="emit('toggle')"
	>
		<AppIcon v-if="isActive" name="ph:check-bold" size="xs" />
		{{ label }}
	</UiButton>
</template>
