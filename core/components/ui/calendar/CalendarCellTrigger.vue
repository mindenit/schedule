<script lang="ts" setup>
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CalendarCellTrigger, type CalendarCellTriggerProps, useForwardProps } from "reka-ui"
import { cn } from "@/core/utils"
import { buttonVariants } from "@/core/components/ui/button"

const props = withDefaults(
	defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes["class"] }>(),
	{
		as: "button",
	}
)

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
	<CalendarCellTrigger
		data-slot="calendar-cell-trigger"
		:class="
			cn(
				buttonVariants({ variant: 'ghost' }),
				'size-8 w-full cursor-default p-0 font-normal aria-selected:opacity-100',
				`[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground`,
				// Selected
				`data-[selected]:bg-primary data-[selected]:hover:bg-primary data-[selected]:focus:bg-primary data-[selected]:opacity-100`,
				// Disabled
				'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
				// Unavailable
				'data-[unavailable]:text-destructive-foreground data-[unavailable]:line-through',
				// Outside months
				'data-[outside-view]:text-muted-foreground',
				props.class
			)
		"
		v-bind="forwardedProps"
	>
		<slot />
	</CalendarCellTrigger>
</template>
