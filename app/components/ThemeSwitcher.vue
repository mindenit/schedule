<script lang="ts" setup>
const colorMode = useColorMode()
const { trackEvent } = useAnalytics()

const handleClick = () => {
	const next = colorMode.value === "light" ? "dark" : "light"
	colorMode.preference = next
	trackEvent("theme_changed", { theme: next })
}

const themeIcon = computed(() => (colorMode.value !== "light" ? "lucide:moon" : "lucide:sun"))
</script>

<template>
	<UiButton
		variant="ghost"
		size="icon"
		:aria-label="colorMode.value === 'light' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'"
		@click="handleClick()"
	>
		<AppIcon :name="themeIcon" />
	</UiButton>
</template>
