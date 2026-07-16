/**
 * Direct fetch utility for the sharable-links backend.
 * Bypasses nurekit — points straight at the backend via the dev proxy.
 *
 * Dev:  browser → /api/sharable-links/... → Nuxt server → http://localhost:8080/api/...
 * Prod: switch BASE_URL to https://sh.mindenit.org/api when going live.
 *
 * Endpoints:
 *   POST /api/sharable-links          body: SharableLinkBlob → { id }
 *   GET  /api/sharable-links/:id      → SharableLinkBundle
 */

import type { SharableLinkBlob, SharableLinkBundle } from "~/types/sharableLinks"

const BASE_URL = import.meta.dev ? "http://localhost:8080/api" : "/api"

interface ApiSuccess<T> {
	success: true
	data: T
}

interface ApiError {
	success: false
	error: {
		code: string
		message: string
		statusCode: number
	}
}

type ApiResponse<T> = ApiSuccess<T> | ApiError

export class SharableLinksApiError extends Error {
	constructor(
		public readonly code: string,
		public readonly statusCode: number,
		message: string
	) {
		super(message)
		this.name = "SharableLinksApiError"
	}
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${BASE_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	})

	const body = (await response.json()) as ApiResponse<T>

	if (!body.success) {
		throw new SharableLinksApiError(body.error.code, body.error.statusCode, body.error.message)
	}

	return body.data
}

export const sharableLinksApi = {
	createLink: (blob: SharableLinkBlob) =>
		apiFetch<{ id: string }>("/sharable-links", {
			method: "POST",
			body: JSON.stringify(blob),
		}),

	getLink: (id: string) => apiFetch<SharableLinkBundle>(`/sharable-links/${id}`),
}
