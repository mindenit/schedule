<script setup lang="ts">
const calendarStore = useCalendarStore()
const today = new Date()
function handleClick() {
	calendarStore.setSelectedDate(today)
}
</script>

<template>
	<Button variant="secondary" size="icon" class="md:hidden" @click="handleClick">
		<AppIcon name="lucide:calendar-days" />
	</Button>

	<Button variant="secondary" class="max-md:hidden" @click="handleClick"> Сьогодні </Button>
</template>
