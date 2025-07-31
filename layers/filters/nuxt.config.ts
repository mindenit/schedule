export default defineNuxtConfig({
	extends: ["../site"],
	components: [{ path: "./components", prefix: "Filters", pathPrefix: false }],
})
