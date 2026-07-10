/**
 * Nitro startup plugin — validates required environment variables.
 *
 * Runs once when the server process initialises (not at build time), so:
 *   - Local/CI builds succeed without production secrets.
 *   - A broken prod deploy fails fast on container start, before any traffic
 *     is routed — readiness probe (/_ready) never returns 200, orchestrators
 *     reject the release and roll back automatically.
 */

const REQUIRED_ENV: string[] = ["NUXT_OG_IMAGE_SECRET"]

export default defineNitroPlugin(() => {
	if (process.env.NODE_ENV !== "production") return

	const missing = REQUIRED_ENV.filter((key) => !process.env[key])

	if (missing.length) {
		console.error(
			`[env-check] Missing required environment variable(s): ${missing.join(", ")}. ` +
				"Set them in your deployment environment and restart."
		)
		process.exit(1)
	}
})
