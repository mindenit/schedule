<script setup lang="ts">
const calendarStore = useCalendarStore()

const today = new Date()

function handleClick() {
	calendarStore.setSelectedDate(today)
}
</script>

<template>
	<Button variant="secondary" @click="handleClick"> Сьогодні </Button>
</template>
