import { usePreferredReducedMotion } from "@vueuse/core"

/**
 * Centralises prefers-reduced-motion handling across the app.
 *
 * - `isReduced` — reactive boolean; true when the user has enabled "reduce
 *   motion" at the OS level. Use to conditionally skip animations.
 * - `duration(ms)` — returns the given duration (in ms) or 0 when reduced.
 *   Useful for motion-v / CSS custom-property injection.
 * - `enabled` — reactive boolean shorthand for `!isReduced`. Intended for
 *   v-if guards on heavier visual effects (e.g. SnowEffect, HiringInfo).
 *
 * NOTE: useSwipeNavigator handles reduced motion inline via window.matchMedia
 * because it runs before the reactive graph is set up. Do not replace that
 * usage with this composable — the non-reactive snapshot there is intentional.
 */
export function useMotionSafe() {
	const preference = usePreferredReducedMotion()
	const isReduced = computed(() => preference.value === "reduce")
	const enabled = computed(() => !isReduced.value)

	function duration(ms: number): number {
		return isReduced.value ? 0 : ms
	}

	return { isReduced, enabled, duration }
}
