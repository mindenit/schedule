/**
 * Readiness probe — "should traffic be routed to this instance?".
 *
 * Returns 503 when the app is in maintenance mode so load balancers,
 * K8s readiness probes, and reverse proxies can drain traffic without
 * restarting the process. Returns 200 during normal operation.
 *
 * This endpoint is intentionally separate from /_health (liveness):
 * a 503 here must NOT cause the container orchestrator to restart the pod.
 * Wire /_health to the liveness probe and /_ready to the readiness probe.
 *
 * Intentionally placed outside /api/ to avoid conflicting with the backend
 * API proxied at /api in production (sh.mindenit.org/api → sh.mindenit.org:8000/api).
 *
 * Response (200 OK — normal):
 *   { ready: true, ts: <unix ms>, version: "1.0.0", build: "a1b2" }
 *
 * Response (503 — maintenance):
 *   { ready: false, reason: "maintenance", ts: <unix ms>, version: "1.0.0", build: "a1b2" }
 *   Header: Retry-After: 30
 */
export default defineEventHandler((event) => {
	const config = useRuntimeConfig()
	const maintenance = !!config.public.maintenance

	const base = {
		ts: Date.now(),
		version: config.public.appVersion,
		build: config.public.commitSha,
	}

	if (maintenance) {
		setResponseStatus(event, 503)
		setResponseHeader(event, "Retry-After", 30)
		return { ready: false, reason: "maintenance", ...base }
	}

	return { ready: true, ...base }
})
