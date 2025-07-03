<script lang="ts" setup>
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CalendarHeading, type CalendarHeadingProps, useForwardProps } from "reka-ui"
import { cn } from "@/core/utils"

const props = defineProps<CalendarHeadingProps & { class?: HTMLAttributes["class"] }>()

defineSlots<{
	default: (props: { headingValue: string }) => any
}>()

const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)

const formatHeading = (value: string | undefined): string => {
	if (!value) return ""
	const withoutYearSuffix = value.replace(" р.", "")
	return withoutYearSuffix.charAt(0).toUpperCase() + withoutYearSuffix.slice(1)
}
</script>

<template>
	<CalendarHeading
		v-slot="{ headingValue }"
		data-slot="calendar-heading"
		:class="cn('text-sm font-medium', props.class)"
		v-bind="forwardedProps"
	>
		<slot :heading-value="headingValue">
			{{ formatHeading(headingValue) }}
		</slot>
	</CalendarHeading>
</template>
