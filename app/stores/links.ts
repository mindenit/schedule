import { defineStore, skipHydrate } from "pinia"
import { useStorage } from "@vueuse/core"
import type { Subject } from "nurekit"
import { STORAGE_KEYS } from "~/constants/storage"
import { downloadFile } from "~/utils/download"

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
	const links = skipHydrate(useStorage<LinksStore>(STORAGE_KEYS.links, {}))

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
			id: randomUUID(),
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
		const subjectEntry = links.value[subjectKey]
		if (!subjectEntry?.events[eventType]) return

		subjectEntry.events[eventType] = subjectEntry.events[eventType].filter(
			(l) => l.id !== linkId
		)

		// Prune empty eventType bucket
		if (subjectEntry.events[eventType].length === 0) {
			const { [eventType]: _removed, ...rest } = subjectEntry.events
			subjectEntry.events = rest
		}

		// Prune subject when all event types are gone
		if (Object.keys(subjectEntry.events).length === 0) {
			const { [subjectKey]: _removed, ...rest } = links.value
			links.value = rest
		}
	}

	function getLinkName(url: string): string {
		if (url.includes("meet.google.com")) return "Google Meet"
		if (url.includes("zoom.us")) return "Zoom"
		if (url.includes("dl.nure.ua")) return "Nure DL"
		return "Посилання"
	}

	function exportLinks() {
		const blob = new Blob([JSON.stringify(links.value, null, 2)], { type: "application/json" })
		downloadFile(blob, `schedule-links-backup-${new Date().toISOString().split("T")[0]}.json`)
	}

	function exportSelectedLinks(linkIds: string[]) {
		const idSet = new Set(linkIds)
		const filtered: LinksStore = {}

		Object.entries(links.value).forEach(([subjectId, subjectData]) => {
			const filteredEvents: Record<string, (typeof subjectData.events)[string]> = {}

			Object.entries(subjectData.events).forEach(([eventType, eventLinks]) => {
				const matching = eventLinks.filter((l) => idSet.has(l.id))
				if (matching.length > 0) filteredEvents[eventType] = matching
			})

			if (Object.keys(filteredEvents).length > 0) {
				filtered[subjectId] = { subject: subjectData.subject, events: filteredEvents }
			}
		})

		const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" })
		downloadFile(blob, `schedule-links-selected-${new Date().toISOString().split("T")[0]}.json`)
	}

	function importLinks(jsonString: string): { success: boolean; error?: string } {
		let data: unknown
		try {
			data = JSON.parse(jsonString)
		} catch {
			return { success: false, error: "Файл пошкоджений або не є коректним JSON" }
		}

		try {
			if (Array.isArray(data)) {
				data.forEach((item) => {
					if (item.subjectId && item.subject && item.eventType && item.link) {
						const subjectKey = item.subjectId.toString()

						if (!links.value[subjectKey]) {
							links.value[subjectKey] = {
								subject: item.subject,
								events: {},
							}
						}

						if (!links.value[subjectKey].events[item.eventType]) {
							links.value[subjectKey].events[item.eventType] = []
						}

						const existingLink = links.value[subjectKey].events[item.eventType]!.find(
							(l) => l.id === item.link.id
						)

						if (!existingLink) {
							links.value[subjectKey].events[item.eventType]!.push(item.link)
						}
					}
				})
				return { success: true }
			}

			if (isOldFormat(data)) {
				links.value = convertFromOldFormat(data)
			} else {
				links.value = data
			}

			return { success: true }
		} catch {
			return { success: false, error: "Формат файлу не підтримується або дані пошкоджені" }
		}
	}

	function isOldFormat(data: unknown): boolean {
		if (!data || typeof data !== "object") return false

		const firstKey = Object.keys(data)[0]
		if (!firstKey) return false

		const firstValue = (data as Record<string, unknown>)[firstKey]
		return (
			Array.isArray(firstValue) ||
			(!!firstValue && !Object.prototype.hasOwnProperty.call(firstValue, "subject"))
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
		exportSelectedLinks,
		importLinks,
		getSubjectInfo,
	}
})
