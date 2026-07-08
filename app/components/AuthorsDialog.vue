<script setup lang="ts">
import { AUTHORS } from "~/constants"
</script>

<template>
	<UiDialog>
		<UiDialogTrigger as-child>
			<UiButton variant="ghost" size="sm" class="w-full justify-start gap-2">
				<AppIcon name="lucide:info" />
				Про авторів
			</UiButton>
		</UiDialogTrigger>
		<UiDialogContent class="sm:max-w-md">
			<UiDialogHeader>
				<UiDialogTitle class="flex items-center gap-2">
					<AppIcon name="lucide:users" />
					Про авторів
				</UiDialogTitle>
				<UiDialogDescription>
					Інформація про розробників цього застосунку
				</UiDialogDescription>
			</UiDialogHeader>

			<div class="space-y-4">
				<div
					v-for="author in AUTHORS"
					:key="author.name"
					class="bg-muted flex items-center gap-3 rounded-lg p-3"
				>
					<img
						:src="author.avatar"
						:alt="author.name"
						width="40"
						height="40"
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
						target="_blank"
						rel="noopener noreferrer"
						:aria-label="`Профіль ${author.name} в LinkedIn`"
						class="hover:bg-accent dark:hover:bg-accent/50 ml-auto inline-flex size-9
							shrink-0 items-center justify-center rounded-md transition-colors"
					>
						<AppIcon name="brandico:linkedin-rect" />
					</NuxtLink>
				</div>

				<div class="text-muted-foreground text-center text-base">
					<p>Застосунок розроблено за підтримки</p>
					<p>Харківського національного університету радіоелектроніки</p>
					<p class="mt-2 text-[0.65rem] leading-relaxed">
						Mindenit Schedule не є офіційним джерелом розкладу занять ХНУРЕ.
						Адміністрація сайту не несе відповідальності за актуальність та
						достовірність інформації щодо розкладу. Для отримання офіційної інформації
						рекомендуємо звертатися до офіційних джерел університету.
					</p>
				</div>
			</div>

			<UiDialogFooter class="flex items-center justify-center">
				<div class="text-muted-foreground flex items-center gap-2 text-sm">
					<AppIcon name="lucide:heart" class="text-red-500" />
					Зроблено з любов'ю
				</div>
			</UiDialogFooter>
		</UiDialogContent>
	</UiDialog>
</template>
