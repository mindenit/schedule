/**
 * "local" is a sentinel value meaning "use the browser's local timezone"
 * (i.e. Intl.DateTimeFormat().resolvedOptions().timeZone at runtime).
 */
export const TIMEZONE_LOCAL = "local" as const

/**
 * Returns the resolved IANA timezone name for a stored value.
 * When stored === TIMEZONE_LOCAL, returns the browser's current timezone.
 */
export function resolveTimezone(stored: string): string {
	if (stored === TIMEZONE_LOCAL) {
		return Intl.DateTimeFormat().resolvedOptions().timeZone
	}
	return stored
}

/**
 * Returns the current UTC offset label for an IANA timezone, e.g. "UTC+3" or "UTC-5".
 * Uses Intl.DateTimeFormat so it reflects DST state at the current moment.
 */
export function getUtcOffsetLabel(iana: string): string {
	try {
		const fmt = new Intl.DateTimeFormat("en", {
			timeZone: iana,
			timeZoneName: "shortOffset",
		})
		const parts = fmt.formatToParts(new Date())
		const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? ""
		// "GMT+3" → "UTC+3", "GMT" → "UTC+0"
		return offsetPart.replace("GMT", "UTC").replace(/^UTC$/, "UTC+0")
	} catch {
		return ""
	}
}

export interface CuratedZone {
	label: string
	iana: string
}

export interface CuratedGroup {
	group: string
	zones: CuratedZone[]
}

export const CURATED_TIMEZONES: CuratedGroup[] = [
	{
		group: "Україна",
		zones: [{ label: "Київ", iana: "Europe/Kyiv" }],
	},
	{
		group: "Європа",
		zones: [
			{ label: "Варшава, Прага", iana: "Europe/Warsaw" },
			{ label: "Берлін, Відень", iana: "Europe/Berlin" },
			{ label: "Амстердам", iana: "Europe/Amsterdam" },
			{ label: "Рим, Мадрид", iana: "Europe/Rome" },
			{ label: "Будапешт", iana: "Europe/Budapest" },
			{ label: "Бухарест", iana: "Europe/Bucharest" },
			{ label: "Хельсінкі", iana: "Europe/Helsinki" },
			{ label: "Афіни", iana: "Europe/Athens" },
			{ label: "Лондон", iana: "Europe/London" },
			{ label: "Лісабон", iana: "Europe/Lisbon" },
		],
	},
	{
		group: "Близький Схід / Африка",
		zones: [
			{ label: "Стамбул", iana: "Europe/Istanbul" },
			{ label: "Тель-Авів", iana: "Asia/Jerusalem" },
			{ label: "Дубай", iana: "Asia/Dubai" },
			{ label: "Каїр", iana: "Africa/Cairo" },
		],
	},
	{
		group: "Азія",
		zones: [
			{ label: "Тбілісі", iana: "Asia/Tbilisi" },
			{ label: "Баку", iana: "Asia/Baku" },
			{ label: "Ташкент", iana: "Asia/Tashkent" },
			{ label: "Алмати", iana: "Asia/Almaty" },
			{ label: "Бангкок, Ханой", iana: "Asia/Bangkok" },
			{ label: "Пекін", iana: "Asia/Shanghai" },
			{ label: "Токіо", iana: "Asia/Tokyo" },
		],
	},
	{
		group: "Америка",
		zones: [
			{ label: "Монреаль, Торонто, Нью-Йорк", iana: "America/New_York" },
			{ label: "Чикаго", iana: "America/Chicago" },
			{ label: "Денвер", iana: "America/Denver" },
			{ label: "Ванкувер, Лос-Анджелес", iana: "America/Los_Angeles" },
		],
	},
	{
		group: "Австралія / Океанія",
		zones: [{ label: "Сідней", iana: "Australia/Sydney" }],
	},
]
