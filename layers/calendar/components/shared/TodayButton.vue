<script setup lang="ts">
const calendarStore = useCalendarStore()
const today = new Date()
function handleClick() {
	calendarStore.setSelectedDate(today)
}
</script>

<template>
	<Button variant="secondary" size="icon" class="md:hidden" @click="handleClick">
		<Icon name="lucide:calendar-days" class="!size-4" />
	</Button>

	<Button variant="secondary" class="max-md:hidden" @click="handleClick"> Сьогодні </Button>
</template>
