import { createHash, timingSafeEqual } from "node:crypto"

const hash = (s: string) => createHash("sha256").update(s).digest()

/**
 * HTTP Basic Auth for /dash and /dash-api/* routes.
 *
 * Browser sends credentials as "Basic base64(user:pass)".
 * We hash both sides before comparing so the check is timing-safe.
 *
 * Fails closed: if NUXT_DASH_USER or NUXT_DASH_PASSWORD is not set,
 * returns 503 on /dash* instead of serving an unprotected dashboard.
 */
export default defineEventHandler((event) => {
	if (!event.path.startsWith("/dash")) return

	const config = useRuntimeConfig()
	const expectedUser = config.dashUser as string | undefined
	const expectedPass = config.dashPassword as string | undefined

	if (!expectedUser || !expectedPass) {
		setResponseStatus(event, 503)
		return "Dashboard auth not configured"
	}

	const authHeader = getRequestHeader(event, "authorization") ?? ""
	const [scheme, encoded] = authHeader.split(" ")

	if (scheme?.toLowerCase() !== "basic" || !encoded) {
		setResponseStatus(event, 401)
		setResponseHeader(event, "WWW-Authenticate", 'Basic realm="Schedule Dashboard"')
		return "Unauthorized"
	}

	const decoded = Buffer.from(encoded, "base64").toString("utf8")
	const colonIdx = decoded.indexOf(":")
	if (colonIdx === -1) {
		setResponseStatus(event, 401)
		setResponseHeader(event, "WWW-Authenticate", 'Basic realm="Schedule Dashboard"')
		return "Unauthorized"
	}

	const providedUser = decoded.slice(0, colonIdx)
	const providedPass = decoded.slice(colonIdx + 1)

	const userOk = timingSafeEqual(hash(providedUser), hash(expectedUser))
	const passOk = timingSafeEqual(hash(providedPass), hash(expectedPass))

	if (!userOk || !passOk) {
		setResponseStatus(event, 401)
		setResponseHeader(event, "WWW-Authenticate", 'Basic realm="Schedule Dashboard"')
		return "Unauthorized"
	}
})
