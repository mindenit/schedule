<script setup lang="ts">
import type { SharableLink } from "~/composables/useSharableLinks"

useSeo({
	title: "Імпорт спільних посилань",
	description: "Вам запропоновано імпортувати колекцію посилань до вашого розкладу.",
	noindex: true,
})

definePageMeta({
	layout: "without-navbar",
})

const route = useRoute()
const { getSharableLink, acceptSharableLink, isLoading } = useSharableLinks()
const { trackEvent } = useAnalytics()

const linkId = route.params.id as string
const sharableData = ref<SharableLink | null>(null)
const loadingData = ref(true)
const accepted = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
	try {
		const data = await getSharableLink(linkId)
		if (data) {
			sharableData.value = data
		} else {
			error.value = "Не вдалося завантажити посилання"
		}
	} catch {
		error.value = "Сталась помилка при завантаженні посилань"
	} finally {
		loadingData.value = false
	}
})

const handleAccept = async () => {
	const success = await acceptSharableLink(linkId)
	if (success) {
		accepted.value = true
		trackEvent("links_share_accepted", { count: sharableData.value?.links.length ?? 0 })
	}
}
</script>

<template>
	<div
		class="from-background to-muted flex min-h-screen items-center justify-center
			bg-gradient-to-br p-4"
	>
		<div class="w-full max-w-2xl">
			<div v-if="loadingData" class="text-center">
				<TheLoader />
				<p class="text-muted-foreground mt-4">Завантаження посилань...</p>
			</div>

			<div
				v-else-if="error"
				class="bg-destructive/10 border-destructive rounded-lg border p-8 text-center"
			>
				<AppIcon
					name="lucide:alert-circle"
					class="text-destructive mx-auto mb-2"
					size="lg"
				/>
				<h2 class="text-destructive text-lg font-semibold">Помилка</h2>
				<p class="text-muted-foreground mt-2">{{ error }}</p>
			</div>

			<div
				v-else-if="accepted"
				class="rounded-lg border border-green-200 bg-green-50 p-8 text-center
					dark:border-green-800 dark:bg-green-950"
			>
				<AppIcon
					name="lucide:check-circle-2"
					class="mx-auto mb-4 text-green-600 dark:text-green-400"
					size="xl"
				/>
				<h2 class="text-2xl font-bold text-green-900 dark:text-green-100">Успішно!</h2>
				<p class="mt-2 text-green-800 dark:text-green-200">
					Посилання успішно імпортовані до вашого розпорядження
				</p>
				<NuxtLink to="/">
					<UiButton class="mt-6">
						<AppIcon name="lucide:arrow-left" class="mr-2" />
						Повернутися на головну
					</UiButton>
				</NuxtLink>
			</div>

			<div v-else-if="sharableData" class="space-y-6">
				<div class="space-y-2 text-center">
					<h1 class="text-3xl font-bold">Поділена колекція посилань</h1>
					<p class="text-muted-foreground">
						Вам запропоновано імпортувати {{ sharableData.links.length }}
						{{
							pluralUk(
								sharableData.links.length,
								"посилання",
								"посилання",
								"посилань"
							)
						}}
					</p>
				</div>

				<div class="bg-card divide-y overflow-hidden rounded-lg border">
					<div
						v-for="link in sharableData.links"
						:key="link.id"
						class="hover:bg-muted/50 p-4 transition-colors"
					>
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<p class="line-clamp-1 font-medium">{{ link.label }}</p>
								<p class="text-muted-foreground line-clamp-2 text-sm">
									{{ link.url }}
								</p>
								<div class="mt-2 flex items-center gap-2">
									<UiBadge variant="outline">{{ link.type }}</UiBadge>
									<UiBadge variant="secondary">ID: {{ link.subjectId }}</UiBadge>
								</div>
							</div>
							<a
								:href="link.url"
								target="_blank"
								rel="noopener noreferrer"
								class="shrink-0"
							>
								<UiButton size="sm" variant="ghost">
									<AppIcon name="lucide:external-link" />
								</UiButton>
							</a>
						</div>
					</div>
				</div>

				<div class="flex gap-4">
					<UiButton class="flex-1" size="lg" :disabled="isLoading" @click="handleAccept">
						<AppIcon name="lucide:download" class="mr-2" />
						Імпортувати {{ sharableData.links.length }}
						{{
							pluralUk(
								sharableData.links.length,
								"посилання",
								"посилання",
								"посилань"
							)
						}}
					</UiButton>
					<NuxtLink to="/">
						<UiButton variant="outline" size="lg">
							<AppIcon name="lucide:x" class="mr-2" />
							Скасувати
						</UiButton>
					</NuxtLink>
				</div>

				<p class="text-muted-foreground text-center text-xs">
					Все посилання будуть завантажені до вашого розпорядження
				</p>
			</div>
		</div>
	</div>
</template>
