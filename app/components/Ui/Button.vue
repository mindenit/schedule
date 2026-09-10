<template>
	<component
		:is="elementType"
		:class="
			buttonStyles({
				disabled: disabled || loading,
				variant: variant,
				size: size,
				class: normalizeClass(props.class) || undefined,
			})
		"
		:disabled="disabled || loading || undefined"
		v-bind="forwarded"
	>
		<slot name="loading">
			<Icon v-if="loading" class="size-4 shrink-0 animate-spin" :name="loadingIcon" />
		</slot>
		<slot>
			<span v-if="text">{{ text }}</span>
		</slot>
	</component>
</template>

<script lang="ts">
import { reactiveOmit } from "@vueuse/core"
import { useForwardProps } from "reka-ui"
import { normalizeClass } from "vue"
import type { HtmlHTMLAttributes } from "vue"

import type { NuxtLinkProps } from "#app/components"

/** Exported button styles that can be used by other components. */
export const buttonStyles = tv({
	base: "group focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
			destructive:
				"bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 text-white shadow-xs",
			outline:
				"bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 border shadow-xs",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
			ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
			link: "text-primary underline-offset-4 hover:underline",
		},
		size: {
			xs: "h-7 gap-1 px-2.5 text-xs has-[>svg]:px-2",
			sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
			default: "h-9 px-4 py-2 has-[>svg]:px-3",
			lg: "h-10 px-6 has-[>svg]:px-4",
			"icon-xs": "size-7",
			"icon-sm": "size-8",
			icon: "size-9",
			"icon-lg": "size-10",
		},
		disabled: {
			true: "pointer-events-none opacity-50",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
})
export type ButtonVariants = VariantProps<typeof buttonStyles>
export type ButtonProps = NuxtLinkProps & {
	/** The type for the button. */
	type?: "button" | "submit" | "reset"
	/** Whether the button is disabled. */
	disabled?: boolean
	/** Whether the button is loading. */
	loading?: boolean
	/** The action to perform when the button is clicked. */
	onClick?: any
	/** The element to render the button as. */
	as?: string
	/** Custom class(es) to add to parent element. */
	class?: HtmlHTMLAttributes["class"]
	/** The variant of the button. */
	variant?: ButtonVariants["variant"]
	/** The size of the button. */
	size?: ButtonVariants["size"]
	/** The text to display in the button. */
	text?: string
	/** The icon to display when the button is loading. */
	loadingIcon?: string
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<ButtonProps>(), {
	type: "button",
	// ponytail: ph is already bundled; line-md was not installed and hit the network.
	loadingIcon: "ph:spinner-bold",
	loading: false,
})

const elementType = computed(() => {
	if (props.as) return props.as
	if (props.href || props.to || props.target) return resolveComponent("NuxtLink")
	return "button"
})

const forwarded = useForwardProps(
	reactiveOmit(
		props,
		"class",
		"text",
		"size",
		"variant",
		"as",
		"loading",
		"disabled",
		"loadingIcon"
	)
)
</script>
