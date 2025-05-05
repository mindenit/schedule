import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"

export default [
	{
		files: ["**/**/*.{js,ts,vue,mjs,mts}"],
		rules: {
			"vue/multi-word-component-names": "off",
			"vue/require-default-prop": "off",
			"vue/no-v-html": "off",
		},
	},
	...eslintPluginPrettierRecommended,
]
