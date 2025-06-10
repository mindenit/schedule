<script setup lang="ts">
import { computed } from "vue"
import type { TEventType } from "../types"

interface Props {
	type: TEventType
	class?: string
}

const props = defineProps<Props>()

const typeColorMap: Record<TEventType, string> = {
	practise: "bg-event-practise",
	lecture: "bg-event-lecture",
	lab: "bg-event-lab",
	consultation: "bg-event-consultation",
	exam: "bg-event-exam",
	credit: "bg-event-credit",
}

const bulletClasses = computed(() => [
	"size-2 rounded-full transition-all duration-200 hover:scale-125",
	typeColorMap[props.type],
	props.class,
])
</script>

<template>
	<div :class="bulletClasses" />
</template>
