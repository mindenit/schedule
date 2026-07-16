export type SharableLinkEventType = "Лк" | "Пз" | "Лб" | "Конс" | "Зал" | "Екз" | "КП/КР"

export interface SharableLinkEntry {
	id: string
	name: string
	url: string
}

export interface SharableLinkSubject {
	subject: { id: number; title: string; brief: string }
	events: Record<string, SharableLinkEntry[]>
}

/** The nested blob — POST body and the `links` field inside GET response `.data`. */
export type SharableLinkBlob = Record<string, SharableLinkSubject>

/** Shape of GET /api/sharable-links/:id → .data */
export interface SharableLinkBundle {
	id: string
	links: SharableLinkBlob
}
