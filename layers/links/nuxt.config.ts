export default defineNuxtConfig({
	extends: ["../site"],
	components: [{ path: "./components", prefix: "Links", pathPrefix: false }],
})
