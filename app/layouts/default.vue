<template>
	<div>
		<DialogManager />

		<!-- Mobile layout -->
		<div class="relative flex h-dvh flex-col overflow-hidden md:hidden">
			<div class="flex-shrink-0">
				<HiringInfo />
				<AppOfflineBanner />
				<ClientOnly>
					<ScheduleEphemeralBanner />
				</ClientOnly>
			</div>

			<nav aria-label="Головна навігація">
				<TheNavbar />
			</nav>
			<main class="flex min-h-0 flex-1 flex-col">
				<h1 class="sr-only">Розклад</h1>
				<slot />
			</main>
			<div class="fixed right-8 bottom-10 z-50">
				<ScheduleAddDialog />
			</div>
			<div class="fixed bottom-10 left-8 z-50">
				<PlayMarketButton />
			</div>
		</div>

		<!-- Desktop layout -->
		<div class="hidden h-dvh flex-col overflow-hidden md:flex">
			<div class="flex-shrink-0">
				<HiringInfo />
				<AppOfflineBanner />
			</div>

			<div class="flex min-h-0 flex-1 flex-col p-6">
				<nav aria-label="Головна навігація">
					<TheNavbar />
				</nav>
				<div class="mt-6 grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-6">
					<aside class="flex min-h-0 flex-col gap-4">
						<TheSidebar show-add-dialog />
					</aside>
					<main class="flex min-h-0 flex-col">
						<h1 class="sr-only">Розклад</h1>
						<slot />
					</main>
				</div>
			</div>
		</div>
	</div>
</template>
