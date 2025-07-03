<script lang="ts" setup>
const colorMode = useColorMode()

const handleClick = () => {
	colorMode.preference = colorMode.value === "light" ? "dark" : "light"
}

const themeIcon = computed(() => (colorMode.value !== "light" ? "lucide:moon" : "lucide:sun"))
</script>

<template>
	<Button variant="ghost" size="icon" @click="handleClick()">
		<Icon :name="themeIcon" class="!size-5" />
	</Button>
</template>
