import type { UIConfig } from "ui-thing";

export default {
	theme: "zinc",
	tailwindCSSLocation: "app/assets/css/tailwind.css",
	componentsLocation: "app/components/Ui",
	composablesLocation: "app/composables",
	pluginsLocation: "app/plugins",
	utilsLocation: "app/utils",
	force: true,
	useDefaultFilename: true,
	packageManager: "pnpm",
} satisfies UIConfig;
