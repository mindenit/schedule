import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
	compatibilityDate: "2024-11-01",
	devtools: { enabled: true },
	extends: ["./core", "./layers/site", "./layers/calendar/", "./layers/schedule/"],
	imports: {
		dirs: [
			"./core/types",
			"./core/constants",
			"./layers/**/types",
			"./layers/**/queries",
			"./layers/**/constants",
		],
	},
	modules: [
		"@nuxt/eslint",
		"@nuxt/icon",
		"@nuxtjs/color-mode",
		"@vueuse/nuxt",
		"shadcn-nuxt",
		"@pinia/nuxt",
		"@nuxt/image",
		"@nuxtjs/seo",
	],
	future: {
		compatibilityVersion: 4,
	},
	css: ["~/core/assets/css/main.css"],
	shadcn: {
		prefix: "",
		componentDir: "./core/components/ui",
	},
	vite: {
		plugins: [tailwindcss()],
	},
	pinia: {
		storesDirs: ["./**/stores/**"],
	},
	icon: {
		provider: "iconify",
		serverBundle: {
			collections: ["lucide"],
		},
	},
	colorMode: {
		preference: "system",
		fallback: "light",
		classSuffix: "",
		storageKey: "nuxt-color-mode",
	},

	site: {
		url: "https://sh.mindenit.org",
		name: "Mindenit Schedule",
		description:
			"Зручний перегляд розкладу занять для студентів та викладачів. Додавайте розклади груп, викладачів та аудиторій, переглядайте їх у зручному форматі по днях, тижнях або на місяць. Швидкий доступ до розкладу у будь-який час.",
		defaultLocale: "uk",
		trailingSlash: false,
		indexable: true,
		debug: process.env.NODE_ENV === "development",
	},
	robots: {
		sitemap: "/sitemap.xml",
		disallow: ["/faggots"],
	},
	sitemap: {
		exclude: ["/faggots"],
	},
	seo: {
		redirectToCanonicalSiteUrl: true,
		fallbackTitle: true,
		automaticDefaults: true,
		metaDataFiles: true,
		meta: {
			ogType: "website",
			twitterCard: "summary_large_image",
			ogLocale: "uk_UA",
		},
	},
})
