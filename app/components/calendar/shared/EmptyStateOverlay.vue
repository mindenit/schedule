<script setup lang="ts">
interface Props {
	show: boolean
	icon?: string
	title?: string
	description?: string
}

withDefaults(defineProps<Props>(), {
	icon: "lucide:calendar-x",
	title: "Немає пар",
	description: "Немає запланованих занять",
})
</script>

<template>
	<AppEmptyState
		v-if="show"
		variant="overlay"
		:icon="icon"
		:title="title"
		:description="description"
	/>
</template>
