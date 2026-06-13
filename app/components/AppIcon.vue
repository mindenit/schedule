<script setup lang="ts">
interface Props {
	name: string
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
	class?: string
}

const props = withDefaults(defineProps<Props>(), {
	size: "sm",
})

const sizeClasses = {
	xs: "!size-3", // 12px
	sm: "!size-4", // 16px
	md: "!size-5", // 20px
	lg: "!size-6", // 24px
	xl: "!size-8", // 32px
	"2xl": "!size-10", // 40px
}

const iconClass = computed(() => {
	const baseClass = sizeClasses[props.size]
	return props.class ? `${baseClass} ${props.class}` : baseClass
})
</script>

<template>
	<Icon :name="props.name" :class="iconClass" />
</template>
