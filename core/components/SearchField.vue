<template>
	<div class="relative w-full items-center">
		<Input
			id="search"
			type="text"
			placeholder="Пошук..."
			class="pl-10"
			:model-value="modelValue"
			@input="$emit('update:modelValue', $event.target.value)"
		/>
		<span class="absolute inset-y-0 start-0 flex items-center justify-center px-2">
			<Icon name="lucide:search" class="text-muted-foreground size-6" />
		</span>
	</div>
</template>

<script setup lang="ts">
interface Props {
	modelValue: string
}

interface Emits {
	(e: "update:modelValue", value: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
