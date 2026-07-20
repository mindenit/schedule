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
			".agents/**",
		],
	},
	{
		files: ["**/**/*.{js,ts,vue,mjs,mts}"],
		rules: {
			"vue/multi-word-component-names": "off",
		},
		...prettier,
	}
).append(
	// Appended AFTER all @nuxt/eslint internal configs so this wins the precedence race.
	// vue/require-default-prop is a false positive for TS-typed optional props —
	// undefined is intentionally the default and withDefaults() handles required ones.
	{
		files: ["**/*.vue"],
		rules: {
			"vue/require-default-prop": "off",
		},
	}
)
