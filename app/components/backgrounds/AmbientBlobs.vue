<script setup lang="ts">
/**
 * AmbientBlobs — zero-dependency ambient background for error pages.
 *
 * Two soft blurred circles positioned at opposite corners create depth
 * without distracting from the error content. Uses palette tokens via
 * Tailwind utilities so it adapts to light/dark mode automatically.
 *
 * Motion: a slow drift animation (12s, alternate). Respects
 * prefers-reduced-motion via CSS @media query in the style block.
 */
</script>

<template>
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
		<!-- Top-left blob -->
		<div
			class="animate-blob-drift bg-royal-blue-400/25 dark:bg-royal-blue-600/20 absolute
				-top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
		/>
		<!-- Bottom-right blob -->
		<div
			class="animate-blob-drift bg-amaranth-400/15 dark:bg-fiord-600/25 absolute -right-32
				-bottom-32 h-80 w-80 rounded-full blur-3xl [animation-delay:6s]"
		/>
	</div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
	div {
		animation: none !important;
	}
}
</style>
