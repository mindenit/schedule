<script setup lang="ts">
interface Props {
	showAddDialog: boolean
}
defineProps<Props>()
</script>

<template>
	<div class="flex h-full flex-col gap-2">
		<div v-if="showAddDialog" class="flex flex-col gap-2">
			<ScheduleAddDialog />
			<div class="flex items-center gap-2">
				<ScheduleSelect />
				<ScheduleDeleteButton />
			</div>
		</div>
		<div v-else class="flex flex-col gap-2">
			<BigCalendarViewSwitcher />
			<div class="flex items-center gap-2">
				<ScheduleSelect />
				<ScheduleDeleteButton />
			</div>
		</div>

		<SidebarCalendar />
		<SidebarTodayEvents />

		<div class="mt-auto flex items-center justify-between gap-2">
			<div class="min-w-0 flex-1">
				<AuthorsDialog />
			</div>
			<div class="flex-shrink-0">
				<ManageLinksDialog>
					<Button size="icon" variant="outline">
						<Icon name="lucide:settings" class="!size-4" />
					</Button>
				</ManageLinksDialog>
			</div>
		</div>
	</div>
</template>
