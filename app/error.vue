<script setup lang="ts">
import type { NuxtError } from "#app"

const props = defineProps<{
	error: NuxtError
}>()

definePageMeta({
	layout: false,
})

const is404 = computed(() => props.error?.statusCode === 404)

const meta = computed(() =>
	is404.value
		? {
				code: "404",
				icon: "lucide:map-off",
				title: "Сторінку не знайдено",
				description:
					"Вибачте, ми не можемо знайти сторінку, яку ви шукаєте. Можливо, її було переміщено або видалено.",
			}
		: {
				code: String(props.error?.statusCode ?? 500),
				icon: "lucide:server-crash",
				title: "Щось пішло не так",
				description:
					"Сталася неочікувана помилка. Спробуйте оновити сторінку або повернутися пізніше.",
			}
)

useSeo({
	title: computed(() => meta.value.title),
	description: computed(() => meta.value.description),
	noindex: true,
})

function handleClearError() {
	clearError({ redirect: "/" })
}

const stackTrace = computed(() => {
	const parts: string[] = []
	if (props.error?.statusCode) parts.push(`Status: ${props.error.statusCode}`)
	if (props.error?.statusMessage) parts.push(`Message: ${props.error.statusMessage}`)
	if (props.error?.message && props.error.message !== props.error.statusMessage)
		parts.push(`Error: ${props.error.message}`)
	if (props.error?.stack) parts.push(`\n${props.error.stack}`)
	return parts.join("\n")
})
</script>

<template>
	<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
		<div class="flex flex-col items-center gap-4">
			<AppIcon :name="meta.icon" size="2xl" class="text-muted-foreground/50" />
			<p class="text-muted-foreground/20 -mb-2 text-8xl font-bold tracking-tight select-none">
				{{ meta.code }}
			</p>
			<h1 class="text-3xl font-semibold">{{ meta.title }}</h1>
			<p class="text-muted-foreground max-w-md text-base">{{ meta.description }}</p>
		</div>

		<div class="flex flex-col items-center gap-3 sm:flex-row">
			<NuxtLink to="/">
				<UiButton size="lg">
					<AppIcon name="lucide:home" />
					Повернутися на головну
				</UiButton>
			</NuxtLink>
			<UiButton v-if="!is404" size="lg" variant="outline" @click="handleClearError">
				<AppIcon name="lucide:refresh-cw" />
				Спробувати ще раз
			</UiButton>
		</div>

		<IsDevelopment>
			<div class="w-full max-w-2xl text-left">
				<p class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
					Dev — Error details
				</p>
				<pre
					class="bg-muted border-border overflow-auto rounded-md border p-4 text-xs leading-relaxed font-mono max-h-96"
				>{{ stackTrace }}</pre>
			</div>
		</IsDevelopment>
	</div>
</template>
