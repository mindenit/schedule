import prettier from "eslint-config-prettier"
import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt(
	// Global ignores must be a standalone config object with only `ignores`
	{
		ignores: [
			"dist/**",
			".nuxt/**",
			"node_modules/**",
			".output/**",
			".git/**",
			"build/**",
			"public/**",
			// UI Thing scaffolded components — generated, not authored
			"app/components/Ui/**",
		],
	},
	{
		files: ["**/**/*.{js,ts,vue,mjs,mts}"],
		rules: {
			"vue/multi-word-component-names": "off",
			"vue/require-default-prop": "off",
		},
		...prettier,
	},
	{
		files: ["**/*.vue"],
		rules: {
			"vue/require-default-prop": "off",
		},
	},
)
