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
			<div class="flex items-center gap-2">
				<ScheduleSelect />
				<ScheduleDeleteButton />
			</div>
		</div>

		<SidebarCalendar />
		<SidebarTodayEvents />

		<div class="mt-auto">
			<AuthorsDialog />
		</div>
	</div>
</template>
