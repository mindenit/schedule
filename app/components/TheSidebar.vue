<script setup lang="ts">
interface Props {
	showAddDialog: boolean
}
defineProps<Props>()
</script>

<template>
	<div class="flex h-full flex-col gap-2">
		<div v-if="showAddDialog" class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<ScheduleAddDialog />
				<FiltersDialog class="hidden md:flex" />
			</div>
			<div class="flex items-center gap-2">
				<ClientOnly>
					<ScheduleSelect />
					<ScheduleDeleteButton />
					<template #fallback>
						<UiSkeleton class="h-9 w-full" />
						<UiSkeleton class="size-9 shrink-0" />
					</template>
				</ClientOnly>
			</div>
		</div>
		<div v-else class="flex flex-col gap-2">
			<BigCalendarViewSwitcher />
			<div class="flex items-center gap-2">
				<ClientOnly>
					<ScheduleSelect />
					<ScheduleDeleteButton />
					<template #fallback>
						<UiSkeleton class="h-9 w-full" />
						<UiSkeleton class="size-9 shrink-0" />
					</template>
				</ClientOnly>
			</div>
		</div>

		<SidebarCalendar />
		<SidebarTodayEvents />

		<PlayMarketButton class="max-md:hidden" />
		<TelegramButton />
		<div class="mt-auto flex items-center justify-between gap-2">
			<div class="min-w-0 flex-1">
				<AuthorsDialog />
			</div>
			<div class="flex flex-shrink-0 items-center gap-2">
				<FiltersDialog class="md:hidden" />
				<SettingsDialog />
			</div>
		</div>
	</div>
</template>
