import { useLinksStore, type Link } from "~/stores/links"
import type { Subject } from "nurekit"

/**
 * Centralised link CRUD with consistent toast feedback.
 *
 * Used by both EventPopover (inline calendar) and SettingsLinksManagement
 * so toasts are identical regardless of entry point.
 */
export function useLinkCrud() {
	const linksStore = useLinksStore()
	const { trackEvent } = useAnalytics()

	function saveLink(
		subjectId: number,
		eventType: string,
		linkData: Partial<Link>,
		subject: Subject,
		editingLink: Link | null
	) {
		if (editingLink) {
			linksStore.updateLink(subjectId, eventType, { ...editingLink, ...linkData })
			trackEvent("link_edited")
			useSonner.success("Посилання оновлено", { description: "Зміни успішно збережено" })
		} else {
			linksStore.addLink(
				subjectId,
				eventType,
				{ url: linkData.url || "", name: linkData.name || "" },
				subject
			)
			trackEvent("link_added")
			useSonner.success("Посилання додано", {
				description: "Нове посилання успішно створено",
			})
		}
	}

	function deleteLink(subjectId: number, eventType: string, linkId: string) {
		linksStore.deleteLink(subjectId, eventType, linkId)
		trackEvent("link_deleted")
		useSonner.success("Посилання видалено", { description: "Посилання успішно видалено" })
	}

	return { saveLink, deleteLink }
}
