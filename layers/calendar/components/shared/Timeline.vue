<script setup lang="ts">
import { isSameDay } from "date-fns"

interface Props {
	weekDays?: Date[]
}

const props = defineProps<Props>()

const currentTime = ref(new Date())
let timer: number | null = null

const getCurrentTimePosition = computed(() => {
	const minutes = currentTime.value.getHours() * 60 + currentTime.value.getMinutes()
	return (minutes / 1440) * 100
})

const shouldShowTimeline = computed(() => {
	if (!props.weekDays || props.weekDays.length === 0) {
		return true
	}

	const today = new Date()
	return props.weekDays.some((day) => isSameDay(day, today))
})

const getTodayColumnIndex = computed(() => {
	if (!props.weekDays || props.weekDays.length === 0) return -1

	const today = new Date()
	return props.weekDays.findIndex((day) => isSameDay(day, today))
})

const getTimelineStyle = computed(() => {
	const baseStyle = { top: `${getCurrentTimePosition.value}%` }

	if (!props.weekDays || props.weekDays.length === 0) {
		return baseStyle
	}

	const todayIndex = getTodayColumnIndex.value
	if (todayIndex === -1) return baseStyle

	const columnWidth = 100 / 7 //
	const leftOffset = todayIndex * columnWidth

	return {
		...baseStyle,
		left: `${leftOffset}%`,
		width: `${columnWidth}%`,
		right: "auto",
	}
})

const getTimelineClasses = computed(() => {
	const baseClasses = "border-primary pointer-events-none absolute z-50 border-t"

	if (!props.weekDays || props.weekDays.length === 0) {
		return `${baseClasses} inset-x-0`
	}

	return baseClasses
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
	<div v-if="shouldShowTimeline" :class="getTimelineClasses" :style="getTimelineStyle">
		<div class="bg-primary absolute -top-1.5 -left-1.5 size-3 rounded-full" />
	</div>
</template>
