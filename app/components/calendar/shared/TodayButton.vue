<script setup lang="ts">
const calendarStore = useCalendarStore()
const today = new Date()
function handleClick() {
	calendarStore.setSelectedDate(today)
}
</script>

<template>
	<UiButton variant="secondary" size="icon" class="md:hidden" @click="handleClick">
		<AppIcon name="lucide:calendar-days" />
	</UiButton>

	<UiButton variant="secondary" class="max-md:hidden" @click="handleClick"> Сьогодні </UiButton>
</template>
