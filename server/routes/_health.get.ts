/**
 * Health check endpoint for uptime monitors and container liveness probes.
 *
 * Usage:
 *   GET /_health
 *
 * Intentionally placed outside /api/ to avoid conflicting with the backend
 * API which is proxied at /api in production (sh.mindenit.org/api → sh.mindenit.org:8000/api).
 *
 * Response (200 OK):
 *   { ok: true, ts: <unix ms>, version: "1.0.0", build: "a1b2", uptime: <seconds> }
 */
export default defineEventHandler(() => {
	const config = useRuntimeConfig()

	return {
		ok: true,
		ts: Date.now(),
		version: config.public.appVersion,
		build: config.public.commitSha,
		uptime: Math.round(process.uptime()),
	}
})
