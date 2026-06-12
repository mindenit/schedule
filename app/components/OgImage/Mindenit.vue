<script lang="ts" setup>
import { computed } from "vue"

interface Props {
	title?: string
	description?: string
	headline?: string
}

const props = withDefaults(defineProps<Props>(), {
	title: "title",
	description: "description",
	headline: "Mindenit",
})

const title = computed(() => props.title.slice(0, 60))
</script>

<template>
	<div
		class="flex h-full w-full flex-row items-center justify-between bg-[#090f1f] px-[100px] py-[20px]"
	>
		<svg
			class="absolute top-0 right-0"
			width="1200"
			height="675"
			viewBox="0 0 1200 675"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g style="mix-blend-mode: overlay" opacity="0.7" filter="url(#filter0_f_448_25)">
				<circle cx="901.5" cy="45.5" r="199.5" fill="#43578F" />
				<circle cx="600.5" cy="216.5" r="199.5" fill="#57668F" />
				<circle cx="179.5" cy="317.5" r="199.5" fill="#43578F" />
			</g>
			<defs>
				<filter
					id="filter0_f_448_25"
					x="-240"
					y="-374"
					width="1561"
					height="1111"
					filterUnits="userSpaceOnUse"
					color-interpolation-filters="sRGB"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
					<feGaussianBlur stdDeviation="110" result="effect1_foregroundBlur_448_25" />
				</filter>
			</defs>
		</svg>

		<div class="flex w-[600px] flex-col gap-4">
			<p v-if="headline" class="text-[24px] font-semibold text-[#57668F] uppercase">
				{{ headline }}
			</p>
			<h1 class="m-0 flex w-[600px] items-center text-[75px] font-semibold text-white">
				<span>{{ title }}</span>
			</h1>
			<p class="text-[32px] leading-tight text-[#E4E4E7]">
				{{ description.slice(0, 200) }}
			</p>
		</div>

		<img src="/logo.svg" alt="Logo" class="size-[300px] rounded-3xl drop-shadow-2xl" />
	</div>
</template>
