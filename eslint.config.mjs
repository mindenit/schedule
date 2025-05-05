import prettier from "eslint-config-prettier"
import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt(
	{
		files: ["**/**/*.{js,ts,vue,mjs,mts}"],
		rules: {
			"vue/multi-word-component-names": "off",
			"vue/require-default-prop": "off",
		},
		ignores: [
			"dist",
			".nuxt",
			"node_modules",
			".output",
			".git",
			"build",
			"LICENSE",
			"*.md",
			"public",
			"package-lock.json",
		],
		...prettier,
	},
	{
		files: ["**/*.vue"],
		rules: {
			"vue/require-default-prop": "off",
		},
	}
)
