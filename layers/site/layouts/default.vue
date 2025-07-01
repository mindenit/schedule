<template>
	<div class="h-dvh p-6">
		<TheNavbar />

		<div class="mt-6 grid grid-cols-[250px_1fr] gap-6">
			<aside class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<ScheduleAddDialog />

					<div class="flex items-center gap-2">
						<ScheduleSelect />
						<ScheduleDeleteButton />
					</div>
				</div>
				<SidebarCalendar />
			</aside>

			<main class="min-h-0">
				<slot />
			</main>
		</div>
	</div>
</template>
