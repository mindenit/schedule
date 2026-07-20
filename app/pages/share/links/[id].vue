<script setup lang="ts">
import type { SharableLink } from "@mindenit/nurekit"

useSeo({
	title: "Імпорт спільних посилань",
	description: "Вам запропоновано імпортувати колекцію посилань до вашого розкладу.",
	noindex: true,
})

definePageMeta({
	layout: "without-navbar",
})

const route = useRoute()
const { getSharableLink, isLoading } = useSharableLinks()
const linksStore = useLinksStore()
const { trackEvent } = useAnalytics()

const linkId = route.params.id as string
const sharableData = ref<SharableLink | null>(null)
const loadingData = ref(true)
const accepted = ref(false)
const expired = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
	try {
		const data = await getSharableLink(linkId)
		if (data) {
			sharableData.value = data
		} else {
			expired.value = true
		}
	} catch {
		error.value = "Сталась помилка при завантаженні посилань"
	} finally {
		loadingData.value = false
	}
})

const totalLinks = computed(() => {
	if (!sharableData.value) return 0
	let count = 0
	for (const entry of Object.values(sharableData.value.links)) {
		for (const links of Object.values(entry.events)) {
			count += links?.length ?? 0
		}
	}
	return count
})

const handleImport = () => {
	if (!sharableData.value) return
	linksStore.mergeBlobIntoLinks(sharableData.value.links)
	accepted.value = true
	trackEvent("links_share_accepted", { count: totalLinks.value })
	useSonner.success("Успішно", { description: "Посилання імпортовано до вашого розпорядження" })
}
</script>

<template>
	<div class="mx-auto w-full max-w-2xl pt-6">
		<!-- Loading -->
		<div
			v-if="loadingData"
			class="flex min-h-[70dvh] flex-col items-center justify-center gap-3"
		>
			<TheLoader />
			<p class="text-muted-foreground text-sm">Завантаження посилань...</p>
		</div>

		<!-- Generic error -->
		<div v-else-if="error" class="py-16 text-center">
			<AppIcon name="lucide:alert-circle" class="text-destructive mx-auto mb-3" size="lg" />
			<h2 class="text-destructive font-semibold">Помилка</h2>
			<p class="text-muted-foreground mt-1 text-sm">{{ error }}</p>
		</div>

		<!-- Expired / not found -->
		<div v-else-if="expired" class="py-16 text-center">
			<AppIcon
				name="lucide:link-2-off"
				class="text-muted-foreground mx-auto mb-3"
				size="lg"
			/>
			<h2 class="font-semibold">Посилання недоступне</h2>
			<p class="text-muted-foreground mt-1 text-sm">
				Термін дії цього посилання закінчився або воно не існує.
			</p>
			<NuxtLink to="/">
				<UiButton class="mt-6" variant="outline" size="sm">
					<AppIcon name="lucide:arrow-left" />
					На головну
				</UiButton>
			</NuxtLink>
		</div>

		<!-- Success -->
		<div v-else-if="accepted" class="py-16 text-center">
			<AppIcon
				name="lucide:check-circle-2"
				class="mx-auto mb-3 text-green-500 dark:text-green-400"
				size="lg"
			/>
			<h2 class="font-semibold">Імпорт завершено</h2>
			<p class="text-muted-foreground mt-1 text-sm">
				{{ totalLinks }}
				{{ pluralUk(totalLinks, "посилання", "посилання", "посилань") }} додано до вашого
				розпорядження
			</p>
			<NuxtLink to="/">
				<UiButton class="mt-6" size="sm">
					<AppIcon name="lucide:arrow-left" />
					На головну
				</UiButton>
			</NuxtLink>
		</div>

		<!-- Preview -->
		<div v-else-if="sharableData" class="space-y-5">
			<div>
				<h1 class="text-xl font-semibold">Імпорт посилань</h1>
				<p class="text-muted-foreground mt-0.5 text-sm">
					{{ totalLinks }}
					{{ pluralUk(totalLinks, "посилання", "посилання", "посилань") }} від іншого
					користувача
				</p>
			</div>

			<!-- Nested: subject → event type → links -->
			<div class="space-y-3">
				<div
					v-for="(subjectData, subjectKey) in sharableData.links"
					:key="subjectKey"
					class="bg-card overflow-hidden rounded-lg border"
				>
					<!-- Subject header -->
					<div class="border-b px-4 py-2.5">
						<p class="text-sm leading-tight font-medium">
							{{ subjectData.subject.title }}
						</p>
						<p class="text-muted-foreground text-xs">{{ subjectData.subject.brief }}</p>
					</div>

					<!-- Event types -->
					<div class="divide-y">
						<div
							v-for="(eventLinks, eventType) in subjectData.events"
							:key="eventType"
							class="px-4 py-3"
						>
							<p
								class="text-muted-foreground mb-2 text-xs font-medium tracking-wide
									uppercase"
							>
								{{ eventType }}
							</p>

							<!-- Links -->
							<div class="space-y-1.5">
								<div
									v-for="link in eventLinks"
									:key="link.id"
									class="flex items-center gap-3"
								>
									<div class="min-w-0 flex-1">
										<p class="line-clamp-1 text-sm font-medium">
											{{ link.name }}
										</p>
										<p class="text-muted-foreground line-clamp-1 text-xs">
											{{ link.url }}
										</p>
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
					</div>
				</div>
			</div>

			<div class="flex gap-2">
				<UiButton :disabled="isLoading" @click="handleImport">
					<AppIcon name="lucide:download" />
					Імпортувати
				</UiButton>
				<NuxtLink to="/">
					<UiButton variant="ghost">Скасувати</UiButton>
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
