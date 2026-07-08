<script lang="ts" setup>
interface Props {
	size?: "lg" | "md" | "sm"
}

const props = withDefaults(defineProps<Props>(), {
	size: "sm",
})

const sizeClasses = {
	lg: "size-12",
	md: "size-8",
	sm: "size-6",
}

const sizeClass = computed(() => {
	return sizeClasses[props.size]
})
</script>

<template>
	<div class="border-primary animate-spin rounded-full border-b-2" :class="sizeClass"></div>
</template>
