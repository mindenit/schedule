<script lang="ts" setup></script>
<template>
	<div
		class="relative mt-24 ml-20 h-15 w-20"
		style="--skin-color: #e4c560; --tap-speed: 0.6s; --tap-stagger: 0.1s"
	>
		<span
			class="animate-tapUpper1 absolute right-[64%] bottom-[32%] h-[35px] w-4/5 origin-[100%_20px] bg-[color:var(--skin-color)] brightness-70 before:absolute before:right-[65%] before:bottom-[8%] before:h-[30px] before:w-[140%] before:origin-[calc(100%_-_20px)_20px] before:rotate-[-60deg] before:rounded-[20px] before:bg-[color:var(--skin-color)] before:content-['']"
		></span>
		<span
			class="animate-tapUpper2 absolute right-[64%] bottom-[32%] h-[35px] w-4/5 origin-[100%_20px] bg-[color:var(--skin-color)] brightness-80 before:absolute before:right-[65%] before:bottom-[8%] before:h-[30px] before:w-[140%] before:origin-[calc(100%_-_20px)_20px] before:rotate-[-60deg] before:rounded-[20px] before:bg-[color:var(--skin-color)] before:content-['']"
			style="animation-delay: 0.1s"
		></span>
		<span
			class="animate-tapUpper3 absolute right-[64%] bottom-[32%] h-[35px] w-4/5 origin-[100%_20px] bg-[color:var(--skin-color)] brightness-90 before:absolute before:right-[65%] before:bottom-[8%] before:h-[30px] before:w-[140%] before:origin-[calc(100%_-_20px)_20px] before:rotate-[-60deg] before:rounded-[20px] before:bg-[color:var(--skin-color)] before:content-['']"
			style="animation-delay: 0.2s"
		></span>
		<span
			class="animate-tapUpper4 absolute right-[64%] bottom-[32%] h-[35px] w-4/5 origin-[100%_20px] bg-[color:var(--skin-color)] brightness-100 before:absolute before:right-[65%] before:bottom-[8%] before:h-[30px] before:w-[140%] before:origin-[calc(100%_-_20px)_20px] before:rotate-[-60deg] before:rounded-[20px] before:bg-[color:var(--skin-color)] before:content-['']"
			style="animation-delay: 0.3s"
		></span>
		<span
			class="absolute top-0 left-0 h-full w-full rounded-[10px_40px] bg-[color:var(--skin-color)]"
		></span>
		<span
			class="absolute right-[1%] bottom-[-18%] h-[38px] w-[120%] origin-[calc(100%_-_20px)_20px] rotate-[-20deg] rounded-[30px_20px_20px_10px] border-b-[2px] border-l-[2px] border-b-[rgba(0,0,0,0.1)] border-l-[rgba(0,0,0,0.1)] bg-[color:var(--skin-color)]"
		></span>
		<!-- Shadow -->
		<span
			class="absolute top-[70%] right-[20%] -z-10 block h-[75%] w-[180%] rounded-[40px_10px] bg-black opacity-30 blur-[10px]"
		></span>
	</div>
</template>
<style>
@keyframes tapUpper1 {
	0%,
	50%,
	100% {
		transform: rotate(10deg) scale(0.4);
	}
	40% {
		transform: rotate(50deg) scale(0.4);
	}
}
@keyframes tapUpper2 {
	0%,
	50%,
	100% {
		transform: rotate(10deg) scale(0.6);
	}
	40% {
		transform: rotate(50deg) scale(0.6);
	}
}
@keyframes tapUpper3 {
	0%,
	50%,
	100% {
		transform: rotate(10deg) scale(0.8);
	}
	40% {
		transform: rotate(50deg) scale(0.8);
	}
}
@keyframes tapUpper4 {
	0%,
	50%,
	100% {
		transform: rotate(10deg) scale(1);
	}
	40% {
		transform: rotate(50deg) scale(1);
	}
}
.animate-tapUpper1 {
	animation: tapUpper1 calc(var(--tap-speed) * 2) ease-in-out infinite;
}
.animate-tapUpper2 {
	animation: tapUpper2 calc(var(--tap-speed) * 2) ease-in-out infinite;
}
.animate-tapUpper3 {
	animation: tapUpper3 calc(var(--tap-speed) * 2) ease-in-out infinite;
}
.animate-tapUpper4 {
	animation: tapUpper4 calc(var(--tap-speed) * 2) ease-in-out infinite;
}
</style>
