import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
	compatibilityDate: "2024-11-01",
	devtools: { enabled: true },
	extends: ["./core", "./layers/site"],
	imports: {
		dirs: ["./core/types", "./core/constants", "./layers/**/types", "./layers/**/queries"],
	},
	modules: ["@nuxt/eslint", "@nuxt/icon", "@nuxtjs/color-mode", "@vueuse/nuxt", "shadcn-nuxt"],
	future: {
		compatibilityVersion: 4,
	},
	css: ["~/core/assets/css/main.css"],
	shadcn: {
		prefix: "",
	},
	vite: {
		plugins: [tailwindcss()],
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
