/**
 * Liveness probe — "is the Node process alive?".
 *
 * Always returns 200 OK while the process responds. Used by container liveness
 * probes and uptime monitors (Uptime Kuma, UptimeRobot, etc.).
 *
 * Do NOT use this endpoint to decide whether to route user traffic —
 * use /_ready (readiness probe) for that.
 *
 * Intentionally placed outside /api/ to avoid conflicting with the backend
 * API which is proxied at /api in production (sh.mindenit.org/api → sh.mindenit.org:8000/api).
 *
 * Response (200 OK):
 *   {
 *     ok: true,
 *     status: "ok" | "maintenance",
 *     maintenance: boolean,
 *     ts: <unix ms>,
 *     version: "1.0.0",
 *     build: "a1b2",
 *     uptime: <seconds>,
 *   }
 */
export default defineEventHandler(() => {
	const config = useRuntimeConfig()
	const maintenance = !!config.public.maintenance

	return {
		ok: true,
		status: maintenance ? "maintenance" : "ok",
		maintenance,
		ts: Date.now(),
		version: config.public.appVersion,
		build: config.public.commitSha,
		uptime: Math.round(process.uptime()),
	}
})
