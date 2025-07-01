<script setup lang="ts">
import { type DateValue, getLocalTimeZone, today } from "@internationalized/date"
import { type Ref, ref } from "vue"

const value = ref(today(getLocalTimeZone())) as Ref<DateValue>
</script>

<template>
	<Calendar v-model="value" :weekday-format="'short'" class="bg-card rounded-md" />
</template>
