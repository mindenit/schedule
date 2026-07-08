<script lang="ts" setup>
interface Props {
	title?: string
	description?: string
	headline?: string
}

const props = withDefaults(defineProps<Props>(), {
	title: "Розклад занять ХНУРЕ",
	description: "Зручний перегляд розкладу занять для студентів та викладачів.",
	headline: "Mindenit Schedule",
})

const truncate = (str: string, max: number) => {
	if (str.length <= max) return str
	const cut = str.slice(0, max)
	const lastSpace = cut.lastIndexOf(" ")
	return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…"
}

const displayTitle = computed(() => truncate(props.title, 60))
const displayDescription = computed(() => truncate(props.description, 160))
</script>

<template>
	<div
		class="flex h-full w-full flex-row items-center justify-between bg-[#090f1f] px-[80px]
			py-[40px]"
	>
		<!-- background blob -->
		<svg
			class="absolute top-0 right-0"
			width="1200"
			height="630"
			viewBox="0 0 1200 630"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g style="mix-blend-mode: overlay" opacity="0.7" filter="url(#blur)">
				<circle cx="950" cy="60" r="220" fill="#43578F" />
				<circle cx="650" cy="220" r="200" fill="#57668F" />
				<circle cx="200" cy="360" r="200" fill="#43578F" />
			</g>
			<defs>
				<filter
					id="blur"
					x="-260"
					y="-380"
					width="1580"
					height="1150"
					filterUnits="userSpaceOnUse"
					color-interpolation-filters="sRGB"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feBlend
						mode="normal"
						in="SourceGraphic"
						in2="BackgroundImageFix"
						result="shape"
					/>
					<feGaussianBlur stdDeviation="110" result="effect1_foregroundBlur" />
				</filter>
			</defs>
		</svg>

		<!-- content -->
		<div class="relative flex w-[620px] flex-col gap-5">
			<p
				class="m-0 text-[20px] font-semibold tracking-widest text-[#57668F] uppercase"
				style="font-family: Inter, sans-serif"
			>
				{{ headline }}
			</p>
			<h1
				class="m-0 text-[64px] leading-none font-bold text-white"
				style="font-family: Inter, sans-serif"
			>
				{{ displayTitle }}
			</h1>
			<p
				class="m-0 text-[28px] leading-snug text-[#a1a1aa]"
				style="font-family: Inter, sans-serif"
			>
				{{ displayDescription }}
			</p>
		</div>

		<!-- logo -->
		<div class="relative shrink-0">
			<img
				src="/logo.svg"
				alt="Mindenit logo"
				class="size-[200px] rounded-[32px] drop-shadow-2xl"
			/>
		</div>
	</div>
</template>
