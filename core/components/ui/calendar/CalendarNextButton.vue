<script lang="ts" setup>
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronRight } from "lucide-vue-next"
import { CalendarNext, type CalendarNextProps, useForwardProps } from "reka-ui"
import { cn } from "@/core/utils"
import { buttonVariants } from "@/core/components/ui/button"

const props = defineProps<CalendarNextProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
	<CalendarNext
		data-slot="calendar-next-button"
		:class="
			cn(
				buttonVariants({ variant: 'ghost' }),
				'absolute right-1',
				'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
				props.class
			)
		"
		v-bind="forwardedProps"
	>
		<slot>
			<ChevronRight class="size-4" />
		</slot>
	</CalendarNext>
</template>
