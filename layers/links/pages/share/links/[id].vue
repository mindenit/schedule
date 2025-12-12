<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRoute } from "vue-router"
import { useSharableLinks } from "~/layers/links/composables/useSharableLinks"

interface SharableLink {
	id: string
	label: string
	url: string
	type: string
	subjectId: number
}

interface SharableData {
	id: string
	links: SharableLink[]
}

definePageMeta({
	layout: "without-navbar",
})

const route = useRoute()
const { getSharableLink, acceptSharableLink, isLoading } = useSharableLinks()

const linkId = computed(() => route.params.id as string)
const sharableData = ref<SharableData | null>(null)
const loadingData = ref(true)
const accepted = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
	if (!linkId.value) {
		error.value = "ID посилання не знайдено"
		loadingData.value = false
		return
	}

	try {
		const data = await getSharableLink(linkId.value)
		if (data) {
			sharableData.value = data
		} else {
			error.value = "Не вдалося завантажити посилання"
		}
	} catch (e) {
		error.value = "Сталась помилка при завантаженні посилань"
		console.error(e)
	} finally {
		loadingData.value = false
	}
})

const handleAccept = async () => {
	const success = await acceptSharableLink(linkId.value)
	if (success) {
		accepted.value = true
	}
}
</script>

<template>
	<div
		class="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4"
	>
		<div class="w-full max-w-2xl">
			<div v-if="loadingData" class="text-center">
				<TheLoader />
				<p class="text-muted-foreground mt-4">Завантаження посилань...</p>
			</div>

			<div
				v-else-if="error"
				class="bg-destructive/10 border-destructive rounded-lg border p-6 text-center"
			>
				<AppIcon name="lucide:alert-circle" class="text-destructive mx-auto mb-2" size="lg" />
				<h2 class="text-destructive text-lg font-semibold">Помилка</h2>
				<p class="text-muted-foreground mt-2">{{ error }}</p>
			</div>

			<div
				v-else-if="accepted"
				class="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800
					dark:bg-green-950"
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
					<Button class="mt-6">
						<AppIcon name="lucide:arrow-left" class="mr-2" />
						Повернутися на головну
					</Button>
				</NuxtLink>
			</div>

			<div v-else-if="sharableData" class="space-y-6">
				<div class="space-y-2 text-center">
					<h1 class="text-3xl font-bold">Поділена колекція посилань</h1>
					<p class="text-muted-foreground">
						Вам запропоновано імпортувати {{ sharableData.links.length }}
						{{ sharableData.links.length === 1 ? "посилання" : "посилань" }}
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
								<p class="text-muted-foreground line-clamp-2 text-sm">{{ link.url }}</p>
								<div class="mt-2 flex items-center gap-2">
									<Badge variant="outline">{{ link.type }}</Badge>
									<Badge variant="secondary">ID: {{ link.subjectId }}</Badge>
								</div>
							</div>
							<a :href="link.url" target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
								<Button size="sm" variant="ghost">
									<AppIcon name="lucide:external-link" class="h-4 w-4" />
								</Button>
							</a>
						</div>
					</div>
				</div>

				<div class="flex gap-4">
					<Button class="flex-1" size="lg" :disabled="isLoading" @click="handleAccept">
						<AppIcon name="lucide:download" class="mr-2" />
						Імпортувати {{ sharableData.links.length }}
						{{ sharableData.links.length === 1 ? "посилання" : "посилань" }}
					</Button>
					<NuxtLink to="/">
						<Button variant="outline" size="lg">
							<AppIcon name="lucide:x" class="mr-2" />
							Скасувати
						</Button>
					</NuxtLink>
				</div>

				<p class="text-muted-foreground text-center text-xs">
					Все посилання будуть завантажені до вашого розпорядження
				</p>
			</div>
		</div>
	</div>
</template>
