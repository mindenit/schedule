<script setup lang="ts">
import { AUTHORS } from "../constants"
import { buttonVariants } from "./ui/button"

const { t } = useI18n()
</script>

<template>
	<Dialog>
		<DialogTrigger as-child>
			<Button variant="ghost" size="sm" class="w-full justify-start gap-2">
				<AppIcon name="lucide:info" />
				{{ t("authors.title") }}
			</Button>
		</DialogTrigger>
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:users" />
					{{ t("authors.title") }}
				</DialogTitle>
				<DialogDescription> {{ t("authors.description") }} </DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<div
					v-for="author in AUTHORS"
					:key="author.name"
					class="bg-muted flex items-center gap-3 rounded-lg p-3"
				>
					<img
						:src="author.avatar"
						:alt="author.name"
						class="pointer-events-none size-10 rounded-full object-cover"
						loading="lazy"
					/>
					<div>
						<p class="font-medium">{{ author.name }}</p>
						<p class="text-muted-foreground text-sm">{{ author.role }}</p>
					</div>
					<NuxtLink
						:to="author.linkedin"
						external
						class="ml-auto"
						:class="buttonVariants({ variant: 'ghost', size: 'icon' })"
						target="_blank"
					>
						<AppIcon name="brandico:linkedin-rect" />
					</NuxtLink>
				</div>

				<div class="text-muted-foreground text-center text-sm">
					<p>{{ t("authors.subtitle") }}</p>
					<p>{{ t("authors.university") }}</p>
				</div>
			</div>

			<DialogFooter class="flex items-center justify-center">
				<div class="text-muted-foreground flex items-center gap-2 text-sm">
					<AppIcon name="lucide:heart" class="text-red-500" />
					{{ t("authors.made_with_love") }}
				</div>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
