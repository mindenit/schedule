<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/core/utils"

const props = defineProps<{
	class?: HTMLAttributes["class"]
}>()
</script>

<template>
	<td
		data-slot="table-cell"
		:class="
			cn(
				`p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]`,
				props.class
			)
		"
	>
		<slot />
	</td>
</template>
