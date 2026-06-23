<script setup lang="ts">
/**
 * AppIcon — thin wrapper around `<Icon>` (@nuxt/icon) that enforces a fixed
 * design-system size scale.
 *
 * Why the `!size-*` (Tailwind `!important`) prefix?
 * @nuxt/icon injects its own `width`/`height` *attributes* and inline styles on
 * the SVG (driven by its `size` prop and the icon's intrinsic viewBox). Plain
 * `size-*` utilities lose the specificity battle against those inline styles
 * and the icon ends up rendering at its own size — visibly wrong inside our
 * buttons/menus. `!important` is the simplest, most local fix: it scopes the
 * override to *this* wrapper without polluting global CSS, and the values
 * here are still part of the design token scale (xs → 2xl).
 *
 * Do not drop the `!` prefix without verifying that @nuxt/icon no longer
 * inlines size styles (check the rendered <svg> in the browser).
 */

interface Props {
	name: string
	size?: "xs" | "3.5" | "sm" | "md" | "lg" | "xl" | "2xl"
	class?: string
}

const props = withDefaults(defineProps<Props>(), {
	size: "sm",
	class: undefined,
})

// `!` (Tailwind important modifier) overrides @nuxt/icon's inline width/height.
// See the block comment above before changing.
const sizeClasses = {
	xs: "!size-3", // 12px
	"3.5": "!size-3.5", // 14px
	sm: "!size-4", // 16px
	md: "!size-5", // 20px
	lg: "!size-6", // 24px
	xl: "!size-8", // 32px
	"2xl": "!size-10", // 40px
}

const iconClass = computed(() => {
	const baseClass = sizeClasses[props.size]
	return props.class ? `${baseClass} ${props.class}` : baseClass
})
</script>

<template>
	<Icon :name="props.name" :class="iconClass" />
</template>
