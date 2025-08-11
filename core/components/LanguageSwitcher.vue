<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const flags: Record<string, string> = {
	uk: "circle-flags:ua",
	en: "circle-flags:gb",
}

function onSelect(lang: string) {
	setLocale(lang as "uk" | "en")
}
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button variant="ghost" size="icon">
				<AppIcon :name="flags[locale as string] ?? 'lucide:languages'" />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuGroup>
				<DropdownMenuItem v-for="lang in locales" :key="lang.code" @click="onSelect(lang.code)">
					<AppIcon :name="flags[lang.code as string] ?? 'lucide:languages'" />
					<span>{{ lang.name }}</span>
				</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
