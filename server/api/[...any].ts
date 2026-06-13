export default defineEventHandler(async (event) => {
	if (!import.meta.dev) {
		throw createError({
			statusCode: 404,
			statusMessage: "Not Found",
		})
	}

	const path = getRouterParam(event, "any") || ""
	const query = getQuery(event)
	const backendUrl = `https://sh.mindenit.org/api/${path}`
	const method = getMethod(event)
	const headers: Record<string, string> = {}
	const headersToProxy = ["content-type", "accept", "authorization"]

	for (const headerName of headersToProxy) {
		const value = getRequestHeader(event, headerName)
		if (value !== undefined) {
			headers[headerName] = value
		}
	}

	headers["cookie"] = getRequestHeader(event, "cookie") || ""
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
			setResponseHeader(event, key, value)
		}

		setResponseStatus(event, response.status)

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
