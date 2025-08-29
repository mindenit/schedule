<template>
	<div
		v-if="$pwa?.showInstallPrompt"
		class="fixed top-4 right-4 left-4 z-50 md:right-4 md:left-auto md:w-80"
	>
		<div class="bg-background rounded-lg border p-4 shadow-lg">
			<div class="flex items-center gap-3">
				<AppIcon name="lucide:download" class="text-primary" />
				<div class="flex-1">
					<h3 class="text-sm font-semibold">Встановити додаток</h3>
					<p class="text-muted-foreground text-xs">
						Додайте Schedule на домашній екран для швидкого доступу
					</p>
				</div>
				<div class="flex gap-2">
					<Button @click="$pwa?.install()"> Встановити </Button>
					<Button variant="outline" @click="$pwa?.cancelInstall()"> Пізніше </Button>
				</div>
			</div>
		</div>
	</div>

	<div
		v-if="$pwa?.needRefresh"
		class="fixed top-20 right-4 left-4 z-50 md:right-4 md:left-auto md:w-80"
	>
		<div class="bg-background rounded-lg border p-4 shadow-lg">
			<div class="flex items-center gap-3">
				<AppIcon name="lucide:refresh-cw" class="text-primary" />
				<div class="flex-1">
					<h3 class="text-sm font-semibold">Оновлення доступне</h3>
					<p class="text-muted-foreground text-xs">Натисніть "Оновити" для застосування змін</p>
				</div>
				<div class="flex gap-2">
					<Button @click="$pwa?.updateServiceWorker()"> Оновити </Button>
					<Button variant="outline" @click="$pwa?.cancelPrompt()"> Пізніше </Button>
				</div>
			</div>
		</div>
	</div>

	<div class="fixed top-36 right-4 left-4 z-50 md:right-4 md:left-auto md:w-80">
		<div class="rounded-lg border bg-green-50 p-4 shadow-lg dark:bg-green-950">
			<div class="flex items-center gap-3">
				<AppIcon name="lucide:wifi-off" class="text-success" />
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-green-800 dark:text-green-200">Офлайн режим</h3>
					<p class="text-success text-xs">Додаток готовий до роботи без інтернету</p>
				</div>
				<Button @click="offlineReadyDismissed = true"> OK </Button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp()
const offlineReadyDismissed = ref(false)
</script>
