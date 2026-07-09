<template>
	<div data-slot="chip" class="relative inline-flex shrink-0 items-center justify-center">
		<slot />
		<span
			v-if="localModel"
			:class="[
				styles({
					position,
					size,
					inset,
					class: normalizeClass([props.color, props.class]) || undefined,
				}),
			]"
		>
			<slot name="content">
				{{ text }}
			</slot>
		</span>
	</div>
</template>

<script lang="ts" setup>
import { normalizeClass } from "vue"
import type { HTMLAttributes } from "vue"

defineOptions({ inheritAttrs: false })
const props = withDefaults(
	defineProps<{
		/**
		 * The text to display in the chip.
		 *
		 * Can be overridden by the `content` slot.
		 */
		text?: string
		/**
		 * The color of the chip.
		 *
		 * @default `bg-primary`
		 */
		color?: string
		/**
		 * The size of the chip.
		 *
		 * @default `sm`
		 */
		size?: VariantProps<typeof styles>["size"]
		/**
		 * The position of the chip.
		 *
		 * @default `top-right`
		 */
		position?: VariantProps<typeof styles>["position"]
		/**
		 * Whether the chip should be inset.
		 *
		 * @default `false`
		 */
		inset?: boolean
		/**
		 * Whether the chip should be visible.
		 *
		 * Can be used with `v-model` to control visibility.
		 *
		 * @default `true`
		 */
		show?: boolean
		/** Additional classes to apply to the chip. */
		class?: HTMLAttributes["class"]
	}>(),
	{ show: true, color: "bg-primary", inset: false }
)

const localModel = defineModel<boolean>("show", { default: true })

const styles = tv({
	base: "text-foreground ring-background absolute flex items-center justify-center rounded-full font-medium whitespace-nowrap ring-2",
	variants: {
		position: {
			"top-right": "top-0 right-0",
			"bottom-right": "right-0 bottom-0",
			"top-left": "top-0 left-0",
			"bottom-left": "bottom-0 left-0",
		},
		inset: {
			true: "",
			false: "",
		},
		size: {
			"3xs": "h-1 min-w-1 p-px text-[0.25rem]",
			"2xs": "h-1.25 min-w-1.25 p-px text-[0.313rem]",
			xs: "h-1.5 min-w-1.5 p-px text-[0.375rem]",
			sm: "h-2 min-w-2 p-0.5 text-[0.438rem]",
			md: "h-2.5 min-w-2.5 p-0.5 text-[0.5rem]",
			lg: "h-3 min-w-3 p-0.5 text-[0.625rem]",
			xl: "h-3.5 min-w-3.5 p-1 text-[0.688rem]",
			"2xl": "h-4 min-w-4 p-1 text-xs",
			"3xl": "h-5 min-w-5 p-1 text-sm",
		},
	},
	defaultVariants: {
		size: "sm",
		position: "top-right",
		inset: false,
	},
	compoundVariants: [
		{
			inset: false,
			position: "top-right",
			class: "translate-x-1/2 -translate-y-1/2 transform",
		},
		{
			inset: false,
			position: "bottom-right",
			class: "-translate-x-1/2 translate-y-1/2 transform",
		},
		{
			inset: false,
			position: "top-left",
			class: "-translate-x-1/2 -translate-y-1/2 transform",
		},
		{
			inset: false,
			position: "bottom-left",
			class: "-translate-x-1/2 translate-y-1/2 transform",
		},
	],
})
</script>
