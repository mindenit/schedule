<script setup lang="ts">
import type { NuxtError } from "#app"

const props = defineProps<{
	error: NuxtError
}>()

const is404 = computed(() => props.error?.statusCode === 404)

const meta = computed(() =>
	is404.value
		? {
				code: "404",
				icon: "lucide:map-minus",
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

const { trackEvent } = useAnalytics()
const isOnline = useOnline()

onMounted(() => {
	trackEvent("app_error", {
		status: props.error?.statusCode ?? 500,
		source: "page",
	})
})

function handleClearError() {
	if (!isOnline.value) return
	clearError({ redirect: "/" })
}

const stackTrace = computed(() => {
	const parts: string[] = []
	if (props.error?.statusCode) parts.push(`Status: ${props.error.statusCode}`)
	if (props.error?.statusMessage && props.error.statusMessage !== "undefined")
		parts.push(`Message: ${props.error.statusMessage}`)
	if (
		props.error?.message &&
		props.error.message !== props.error.statusMessage &&
		props.error.message !== "undefined"
	)
		parts.push(`Error: ${props.error.message}`)
	if (props.error?.stack) parts.push(`\n${props.error.stack}`)
	return parts.join("\n")
})
</script>

<template>
	<div
		class="relative flex min-h-screen flex-col items-center justify-center gap-10 p-6
			text-center"
	>
		<!-- Ambient background -->
		<AmbientBlobs />

		<main class="relative z-10 flex flex-col items-center gap-6">
			<!-- Hero icon -->
			<Icon :name="meta.icon" class="text-muted-foreground/50 size-16! md:size-20!" />

			<!-- Status code -->
			<span class="text-8xl font-bold tracking-tight select-none">{{ meta.code }}</span>

			<!-- Title -->
			<h1 class="text-3xl font-semibold">{{ meta.title }}</h1>

			<!-- Description -->
			<p class="text-muted-foreground max-w-md text-base">{{ meta.description }}</p>

			<!-- CTAs -->
			<div class="flex flex-col items-center gap-3 sm:flex-row">
				<NuxtLink to="/">
					<UiButton size="lg">
						<AppIcon name="lucide:home" />
						Повернутися на головну
					</UiButton>
				</NuxtLink>
				<UiButton
					v-if="!is404"
					size="lg"
					variant="outline"
					:disabled="!isOnline"
					@click="handleClearError"
				>
					<AppIcon :name="isOnline ? 'lucide:refresh-cw' : 'lucide:wifi-off'" />
					{{ isOnline ? "Спробувати ще раз" : "Немає з'єднання" }}
				</UiButton>
			</div>
		</main>

		<!-- Dev-only error details — collapsed by default -->
		<IsDevelopment>
			<details class="w-full max-w-2xl text-left">
				<summary
					class="text-muted-foreground mb-2 cursor-pointer text-xs font-medium
						tracking-wide uppercase select-none"
				>
					Dev — Error details
				</summary>
				<pre
					class="bg-muted border-border mt-2 max-h-96 overflow-auto rounded-md border p-4
						font-mono text-xs leading-relaxed"
					>{{ stackTrace }}</pre>
			</details>
		</IsDevelopment>
	</div>
</template>
