/**
 * Server-side proxy for the internal dashboard API.
 *
 * Requests to /dash-api/* are forwarded to the backend API server at
 * NUXT_DASH_API_BASE_URL/api/dash/*. The base URL stays server-side only —
 * the browser never sees it, which is what lets Caddy guard /dash-api/* with
 * basic_auth at the edge without exposing the backend origin.
 *
 * Default base URL points to the same host the schedule backend runs on in
 * local dev (http://localhost:8080). Override via NUXT_DASH_API_BASE_URL env.
 */
export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const base = (config.dashApiBaseUrl as string | undefined) || "http://localhost:8080"

	// Strip /dash-api prefix, keep the rest (e.g. /summary, /runs, /runs/123/groups)
	const path = event.path.replace(/^\/dash-api/, "") || "/"
	const target = `${base.replace(/\/$/, "")}/api/dash${path}`

	return proxyRequest(event, target)
})
