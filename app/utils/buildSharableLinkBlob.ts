import type { SharableLinkBlob } from "~/types/sharableLinks"

interface StoreLink {
	id: string
	url: string
	name: string
}

interface StoreSubject {
	subject: { id: number; title: string; brief: string }
	events: Record<string, StoreLink[]>
}

type StoreState = Record<string, StoreSubject>

/**
 * Builds a SharableLinkBlob from the links store state, filtered to only
 * include links whose IDs are in the provided set.
 *
 * Pure function — no Pinia or Vue dependencies.
 */
export function buildSharableLinkBlob(
	linkIds: Set<string>,
	storeState: StoreState
): SharableLinkBlob {
	const blob: SharableLinkBlob = {}

	for (const [subjectKey, subjectData] of Object.entries(storeState)) {
		const filteredEvents: SharableLinkBlob[string]["events"] = {}

		for (const [eventType, eventLinks] of Object.entries(subjectData.events)) {
			const matching = eventLinks.filter((l) => linkIds.has(l.id))
			if (matching.length > 0) {
				filteredEvents[eventType] = matching.map((l) => ({
					id: l.id,
					name: l.name,
					url: l.url,
				}))
			}
		}

		if (Object.keys(filteredEvents).length > 0) {
			blob[subjectKey] = {
				subject: subjectData.subject,
				events: filteredEvents,
			}
		}
	}

	return blob
}

/** Counts the total number of links across the entire blob. */
export function countBlobLinks(blob: SharableLinkBlob): number {
	let count = 0
	for (const subjectData of Object.values(blob)) {
		for (const links of Object.values(subjectData.events)) {
			count += links.length
		}
	}
	return count
}
