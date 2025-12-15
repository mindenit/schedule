export default defineEventHandler(async (event) => {
	if (process.env.NODE_ENV === "production") {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
		})
	}

	const path = getRouterParam(event, "any") || ""
	const query = getQuery(event)
	const backendUrl = `https://sh.mindenit.org/api/${path}`
	const method = event.node.req.method || "GET"
	const headers: Record<string, string> = {}
	const headersToProxy = ["content-type", "accept", "authorization"]

	for (const headerName of headersToProxy) {
		const value = event.node.req.headers[headerName]
		if (Array.isArray(value)) {
			if (value.length > 0 && typeof value[0] === "string") {
				headers[headerName] = value[0]
			}
		} else if (typeof value === "string") {
			headers[headerName] = value
		}
	}

	headers["cookie"] = event.node.req.headers.cookie || ""
	headers["accept-encoding"] = "identity"

	const fetchOptions: RequestInit = {
		method,
		headers,
		credentials: "include",
	}

	if (["POST", "PUT", "PATCH"].includes(method)) {
		try {
			const body = await readBody(event)
			if (body) {
				fetchOptions.body = JSON.stringify(body)
			}
		} catch {
			// No body or error reading it
		}
	}

	try {
		const response = await fetch(
			new URL(
				backendUrl +
					(Object.keys(query).length
						? "?" + new URLSearchParams(query as Record<string, string>).toString()
						: "")
			).toString(),
			fetchOptions
		)

		const responseHeaders: Record<string, string> = {}
		response.headers.forEach((value, key) => {
			if (
				!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())
			) {
				responseHeaders[key] = value
			}
		})

		for (const [key, value] of Object.entries(responseHeaders)) {
			event.node.res.setHeader(key, value)
		}

		event.node.res.statusCode = response.status

		const contentType = response.headers.get("content-type")
		if (contentType?.includes("application/json")) {
			return response.json()
		}

		return response.text()
	} catch (error) {
		console.error(`[API Proxy Error] ${method} ${backendUrl}:`, error)
		throw createError({
			statusCode: 502,
			statusMessage: "Bad Gateway - Failed to proxy request",
		})
	}
})
