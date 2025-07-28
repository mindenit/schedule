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
	<Button
		:variant="isActive ? 'default' : 'outline'"
		size="sm"
		class="h-8 text-xs"
		@click="emit('toggle')"
	>
		<Icon v-if="isActive" name="lucide:check" class="!size-3" />
		{{ label }}
	</Button>
</template>
