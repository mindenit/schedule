import { ref } from "vue"
import { sharableLinksApi, SharableLinksApiError } from "~/utils/sharableLinksApi"
import { buildSharableLinkBlob, countBlobLinks } from "~/utils/buildSharableLinkBlob"
import type { SharableLinkBundle } from "~/types/sharableLinks"

export type { SharableLinkBundle } from "~/types/sharableLinks"

const ALLOWED_EVENT_TYPES = new Set(["Лк", "Пз", "Лб", "Конс", "Зал", "Екз", "КП/КР"])

export const useSharableLinks = () => {
	const isLoading = ref(false)

	const createSharableLink = async (linkIds: string[]): Promise<string | null> => {
		if (linkIds.length === 0) {
			useSonner.error("Помилка", { description: "Виберіть принаймні одне посилання" })
			return null
		}

		const linksStore = useLinksStore()
		const blob = buildSharableLinkBlob(new Set(linkIds), linksStore.links)

		if (Object.keys(blob).length === 0) {
			useSonner.error("Помилка", { description: "Не вдалося знайти вибрані посилання" })
			return null
		}

		// Client-side validation before hitting the backend
		const totalLinks = countBlobLinks(blob)
		if (totalLinks > 100) {
			useSonner.error("Помилка", {
				description: `Забагато посилань (${totalLinks}). Максимум — 100.`,
			})
			return null
		}

		for (const subjectData of Object.values(blob)) {
			for (const [eventType, links] of Object.entries(subjectData.events)) {
				if (!ALLOWED_EVENT_TYPES.has(eventType)) {
					useSonner.error("Помилка", {
						description: `Непідтримуваний тип заняття: ${eventType}`,
					})
					return null
				}
				for (const link of links) {
					if (!link.name || link.name.length < 1 || link.name.length > 64) {
						useSonner.error("Помилка", {
							description: `Назва посилання має бути від 1 до 64 символів: «${link.name}»`,
						})
						return null
					}
					if (!/^https?:\/\//.test(link.url)) {
						useSonner.error("Помилка", {
							description: `Недійсне посилання (має починатися з http:// або https://): ${link.url}`,
						})
						return null
					}
				}
			}
		}

		try {
			isLoading.value = true
			const result = await sharableLinksApi.createLink(blob)
			return `${window.location.origin}/share/links/${result.id}`
		} catch (err) {
			if (err instanceof SharableLinksApiError) {
				if (err.code === "SHARABLE_LINKS_RATE_LIMIT_EXCEEDED") {
					useSonner.error("Забагато запитів", {
						description: "Ліміт поширення вичерпано. Спробуйте пізніше.",
					})
				} else {
					useSonner.error("Помилка", {
						description: "Не вдалося створити посилання для поділу",
					})
				}
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

	const getSharableLink = async (linkId: string): Promise<SharableLinkBundle | null> => {
		try {
			isLoading.value = true
			return await sharableLinksApi.getLink(linkId)
		} catch (err) {
			if (err instanceof SharableLinksApiError && err.statusCode === 404) {
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
