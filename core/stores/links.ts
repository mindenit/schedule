import { defineStore } from "pinia"
import { useStorage } from "@vueuse/core"

export interface Link {
	id: string
	url: string
	name: string
}

type LinksStore = Record<string, Record<string, Link[]>>

export const useLinksStore = defineStore("links", () => {
	const links = useStorage<LinksStore>("schedule-links", {})

	function getLinks(subjectId: number, eventType: string): Link[] {
		return links.value[subjectId]?.[eventType] || []
	}

	function addLink(subjectId: number, eventType: string, link: Omit<Link, "id">) {
		if (!links.value[subjectId]) {
			links.value[subjectId] = {}
		}
		if (!links.value[subjectId][eventType]) {
			links.value[subjectId][eventType] = []
		}

		const newLink: Link = {
			...link,
			id: crypto.randomUUID(),
			name: link.name || getLinkName(link.url),
		}

		links.value[subjectId][eventType].push(newLink)
	}

	function updateLink(subjectId: number, eventType: string, updatedLink: Link) {
		const eventLinks = links.value[subjectId]?.[eventType]
		if (!eventLinks) return

		const index = eventLinks.findIndex((l) => l.id === updatedLink.id)
		if (index !== -1) {
			eventLinks[index] = {
				...updatedLink,
				name: updatedLink.name || getLinkName(updatedLink.url),
			}
		}
	}

	function deleteLink(subjectId: number, eventType: string, linkId: string) {
		const eventLinks = links.value[subjectId]?.[eventType]
		if (!eventLinks) return

		if (links.value[subjectId] && links.value[subjectId][eventType]) {
			links.value[subjectId][eventType] = eventLinks.filter((l) => l.id !== linkId)
		}
	}

	function getLinkName(url: string): string {
		if (url.includes("meet.google.com")) return "Google Meet"
		if (url.includes("zoom.us")) return "Zoom"
		if (url.includes("dl.nure.ua")) return "Nure DL"
		return "Посилання"
	}

	function exportLinks() {
		const dataStr = JSON.stringify(links.value, null, 2)
		const blob = new Blob([dataStr], { type: "application/json" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `schedule-links-backup-${new Date().toISOString().split("T")[0]}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	function importLinks(jsonString: string): { success: boolean; error?: string } {
		try {
			const newLinks = JSON.parse(jsonString)
			links.value = newLinks
			return { success: true }
		} catch (e) {
			if (e instanceof Error) {
				return { success: false, error: e.message }
			}
			return { success: false, error: "An unknown error occurred during import." }
		}
	}

	return {
		links,
		getLinks,
		addLink,
		updateLink,
		deleteLink,
		exportLinks,
		importLinks,
	}
})
