import { defineStore } from "pinia"
import { useStorage } from "@vueuse/core"
import type { Subject } from "nurekit"

export interface Link {
	id: string
	url: string
	name: string
}

type LinksStore = Record<
	string,
	{
		subject: Subject
		events: Record<string, Link[]>
	}
>

export const useLinksStore = defineStore("links", () => {
	const links = useStorage<LinksStore>("schedule-links", {})

	function getLinks(subjectId: number, eventType: string): Link[] {
		return links.value[subjectId]?.events[eventType] || []
	}

	function addLink(
		subjectId: number,
		eventType: string,
		link: Omit<Link, "id">,
		subjectInfo?: Subject
	) {
		const subjectKey = subjectId.toString()

		if (!links.value[subjectKey]) {
			links.value[subjectKey] = {
				subject: subjectInfo || { id: subjectId, title: "", brief: "" },
				events: {},
			}
		} else if (subjectInfo) {
			links.value[subjectKey].subject = subjectInfo
		}

		if (!links.value[subjectKey].events[eventType]) {
			links.value[subjectKey].events[eventType] = []
		}

		const newLink: Link = {
			...link,
			id: crypto.randomUUID(),
			name: link.name || getLinkName(link.url),
		}

		links.value[subjectKey].events[eventType].push(newLink)
	}

	function updateLink(subjectId: number, eventType: string, updatedLink: Link) {
		const subjectKey = subjectId.toString()
		const eventLinks = links.value[subjectKey]?.events[eventType]
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
		const subjectKey = subjectId.toString()
		const eventLinks = links.value[subjectKey]?.events[eventType]
		if (!eventLinks) return

		if (links.value[subjectKey] && links.value[subjectKey].events[eventType]) {
			links.value[subjectKey].events[eventType] = eventLinks.filter((l) => l.id !== linkId)
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

			if (isOldFormat(newLinks)) {
				links.value = convertFromOldFormat(newLinks)
			} else {
				links.value = newLinks
			}

			return { success: true }
		} catch (e) {
			if (e instanceof Error) {
				return { success: false, error: e.message }
			}
			return { success: false, error: "An unknown error occurred during import." }
		}
	}

	function isOldFormat(data: any): boolean {
		if (!data || typeof data !== "object") return false

		const firstKey = Object.keys(data)[0]
		if (!firstKey) return false

		const firstValue = data[firstKey]
		return (
			Array.isArray(firstValue) ||
			(firstValue && !Object.prototype.hasOwnProperty.call(firstValue, "subject"))
		)
	}

	function convertFromOldFormat(oldData: Record<string, Record<string, Link[]>>): LinksStore {
		const newData: LinksStore = {}

		Object.entries(oldData).forEach(([subjectId, eventTypes]) => {
			newData[subjectId] = {
				subject: {
					id: parseInt(subjectId),
					title: `Предмет ${subjectId}`,
					brief: "",
				},
				events: eventTypes,
			}
		})

		return newData
	}

	function getSubjectInfo(subjectId: number): Subject | null {
		return links.value[subjectId.toString()]?.subject || null
	}

	return {
		links,
		getLinks,
		addLink,
		updateLink,
		deleteLink,
		exportLinks,
		importLinks,
		getSubjectInfo,
	}
})
