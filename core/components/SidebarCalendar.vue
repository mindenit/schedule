<script setup lang="ts">
import { type DateValue, getLocalTimeZone, today } from "@internationalized/date"
import { type Ref, ref, watch } from "vue"

const calendarStore = useCalendarStore()
const value = ref(today(getLocalTimeZone())) as Ref<DateValue>

const dateValueToDate = (dateValue: DateValue): Date => {
	return new Date(dateValue.year, dateValue.month - 1, dateValue.day)
}

watch(value, (newDateValue) => {
	if (newDateValue) {
		const jsDate = dateValueToDate(newDateValue)
		calendarStore.setView("day")
		calendarStore.setSelectedDate(jsDate)
	}
})
</script>

<template>
	<Calendar v-model="value" :weekday-format="'short'" class="bg-card rounded-md" />
</template>
