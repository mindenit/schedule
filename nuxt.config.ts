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
})
