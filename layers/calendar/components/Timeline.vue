<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"

const currentTime = ref(new Date())
let timer: number | null = null

const getCurrentTimePosition = computed(() => {
	const minutes = currentTime.value.getHours() * 60 + currentTime.value.getMinutes()
	return (minutes / 1440) * 100
})

function updateTime() {
	currentTime.value = new Date()
}

onMounted(() => {
	updateTime()
	timer = window.setInterval(updateTime, 60 * 1000)
})

onUnmounted(() => {
	if (timer) {
		clearInterval(timer)
	}
})
</script>

<template>
	<div
		class="border-primary pointer-events-none absolute inset-x-0 z-50 border-t"
		:style="{ top: `${getCurrentTimePosition}%` }"
	>
		<div class="bg-primary absolute -top-1.5 -left-1.5 size-3 rounded-full" />
	</div>
</template>
