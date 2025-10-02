<template>
	<div>
		<DialogManager />
		<div class="relative flex h-dvh flex-col overflow-hidden md:hidden">
			<div class="flex-shrink-0">
				<HiringInfo />
			</div>

			<TheNavbar />
			<main class="flex min-h-0 flex-1 flex-col">
				<slot />
			</main>
			<div class="fixed right-8 bottom-10 z-50">
				<ScheduleAddDialog />
			</div>
			<div class="fixed bottom-10 left-8 z-50">
				<PlayMarketButton />
			</div>
		</div>

		<div class="hidden h-dvh flex-col overflow-hidden md:flex">
			<div class="flex-shrink-0">
				<HiringInfo />
			</div>

			<div class="flex min-h-0 flex-1 flex-col p-6">
				<TheNavbar />
				<div class="mt-6 grid min-h-0 flex-1 grid-cols-[250px_1fr] gap-6">
					<aside class="flex min-h-0 flex-col gap-4">
						<TheSidebar show-add-dialog />
					</aside>
					<main class="flex min-h-0 flex-col">
						<slot />
					</main>
				</div>
			</div>
		</div>
	</div>
</template>
