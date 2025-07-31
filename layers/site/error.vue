<script setup lang="ts">
const pageTitle = `Сторінку не знайдено`
const pageDescription = `Вибачте, ми не можемо знайти сторінку, яку ви шукаєте. Можливо, її було переміщено або видалено.`

useSeoMeta({
	title: pageTitle,
	ogTitle: pageTitle,
	description: pageDescription,
	ogDescription: pageDescription,
})

defineOgImageComponent("Mindenit")

defineProps({
	error: Object,
})
definePageMeta({
	layout: false,
})
</script>

<template>
	<div class="fixed inset-0 flex w-full flex-col items-center justify-center gap-6 p-4 text-center">
		<p class="text-4xl font-semibold">Сторінку не знайдено</p>
		<p class="text-muted-foreground max-w-md text-lg">
			Вибачте, ми не можемо знайти сторінку, яку ви шукаєте. Можливо, її було переміщено або
			видалено.
		</p>
		<NuxtLink to="/">
			<Button size="lg">
				<AppIcon name="lucide:home" />
				Повернутися на головну
			</Button>
		</NuxtLink>
	</div>
</template>
