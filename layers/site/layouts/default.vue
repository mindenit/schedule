<template>
	<div class="flex h-dvh flex-col overflow-hidden p-6">
		<TheNavbar />

		<div class="mt-6 grid min-h-0 flex-1 grid-cols-[250px_1fr] gap-6">
			<aside class="flex min-h-0 flex-col gap-4">
				<div class="flex flex-col gap-2">
					<ScheduleAddDialog />

					<div class="flex items-center gap-2">
						<ScheduleSelect />
						<ScheduleDeleteButton />
					</div>
				</div>

				<SidebarCalendar />

				<SidebarTodayEvents />
			</aside>

			<main class="flex min-h-0 flex-col">
				<slot />
			</main>
		</div>
	</div>
</template>
