import { NurekitError } from "@mindenit/nurekit"
import type { SharableLink, SharableBundle } from "@mindenit/nurekit"

export type { SharableLink, SharableBundle }

function buildBundle(
	linkIds: Set<string>,
	storeLinks: ReturnType<typeof useLinksStore>["links"]
): SharableBundle {
	const bundle: SharableBundle = {}
	for (const [subjectKey, subjectData] of Object.entries(storeLinks)) {
		const filteredEvents: SharableBundle[string]["events"] = {}
		for (const [eventType, eventLinks] of Object.entries(subjectData.events)) {
			const matching = eventLinks.filter((l) => linkIds.has(l.id))
			if (matching.length > 0) {
				filteredEvents[eventType as keyof typeof filteredEvents] = matching.map((l) => ({
					id: l.id,
					name: l.name,
					url: l.url,
				}))
			}
		}
		if (Object.keys(filteredEvents).length > 0) {
			bundle[subjectKey] = { subject: subjectData.subject, events: filteredEvents }
		}
	}
	return bundle
}

function countLinks(bundle: SharableBundle): number {
	let count = 0
	for (const entry of Object.values(bundle)) {
		for (const links of Object.values(entry.events)) {
			count += links?.length ?? 0
		}
	}
	return count
}

export const useSharableLinks = () => {
	const { $nurekit } = useNuxtApp()
	const isLoading = ref(false)

	const createSharableLink = async (linkIds: string[]): Promise<string | null> => {
		if (linkIds.length === 0) {
			useSonner.error("Помилка", { description: "Виберіть принаймні одне посилання" })
			return null
		}

		const linksStore = useLinksStore()
		const bundle = buildBundle(new Set(linkIds), linksStore.links)

		if (Object.keys(bundle).length === 0) {
			useSonner.error("Помилка", { description: "Не вдалося знайти вибрані посилання" })
			return null
		}

		const total = countLinks(bundle)
		if (total > 100) {
			useSonner.error("Помилка", {
				description: `Забагато посилань (${total}). Максимум — 100.`,
			})
			return null
		}

		try {
			isLoading.value = true
			const id = await $nurekit.links.create(bundle)
			return `${window.location.origin}/share/links/${id}`
		} catch (err) {
			if (err instanceof NurekitError && err.statusCode === 429) {
				useSonner.error("Забагато запитів", {
					description: "Ліміт поширення вичерпано. Спробуйте пізніше.",
				})
			} else {
				useSonner.error("Помилка", {
					description: "Не вдалося створити посилання для поділу",
				})
			}
			return null
		} finally {
			isLoading.value = false
		}
	}

	const getSharableLink = async (linkId: string): Promise<SharableLink | null> => {
		try {
			isLoading.value = true
			return await $nurekit.links.getById(linkId)
		} catch (err) {
			if (err instanceof NurekitError && err.statusCode === 404) {
				return null
			}
			useSonner.error("Помилка", { description: "Не вдалося завантажити посилання" })
			return null
		} finally {
			isLoading.value = false
		}
	}

	return {
		isLoading,
		createSharableLink,
		getSharableLink,
	}
}
