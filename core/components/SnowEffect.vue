<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue"
import { useRafFn, useWindowSize } from "@vueuse/core"

const props = withDefaults(
	defineProps<{
		count?: number
		speed?: number
		wind?: number
	}>(),
	{
		count: 400,
		speed: 1,
		wind: 0,
	}
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let w = 0
let h = 0
let angle = 0
let lastScreenX = 0
let lastScreenY = 0
let windowWindX = 0
let windowWindY = 0

// Cellular Automata Grid
const CELL_SIZE = 4
let cols = 0
let rows = 0
let grid: Uint8Array = new Uint8Array(0)
// Image data buffer for rendering grid
let gridImageData: ImageData | null = null
let gridBuffer: Uint32Array | null = null
let offscreenCanvas: HTMLCanvasElement | null = null
let offscreenCtx: CanvasRenderingContext2D | null = null

const { width: winWidth, height: winHeight } = useWindowSize()
const { pause } = useRafFn(() => {
	draw()
})

interface Flake {
	x: number
	y: number
	r: number // radius
	d: number // density/speed modifier
	a: number // angle for sway
	vx: number // velocity x
	vy: number // velocity y
}

const flakes: Flake[] = []
const particles: Flake[] = [] // For splashed snow

const init = () => {
	if (!canvasRef.value) return
	const canvas = canvasRef.value
	w = window.innerWidth
	h = window.innerHeight
	canvas.width = w
	canvas.height = h
	ctx = canvas.getContext("2d")

	lastScreenX = window.screenX
	lastScreenY = window.screenY

	// Initialize grid
	cols = Math.ceil(w / CELL_SIZE)
	rows = Math.ceil(h / CELL_SIZE)
	grid = new Uint8Array(cols * rows).fill(0)
	gridImageData = new ImageData(w, h)
	gridBuffer = new Uint32Array(gridImageData.data.buffer)

	offscreenCanvas = document.createElement("canvas")
	offscreenCanvas.width = w
	offscreenCanvas.height = h
	offscreenCtx = offscreenCanvas.getContext("2d")

	const isMobile = w < 768
	const finalCount = isMobile ? Math.round(props.count / 2) : props.count

	flakes.length = 0
	for (let i = 0; i < finalCount; i++) {
		flakes.push({
			x: Math.random() * w,
			y: Math.random() * h,
			r: Math.random() * 2 + 1, // radius between 1 and 3
			d: Math.random() * finalCount, // density used for unique movement
			a: Math.random() * Math.PI * 2, // random starting angle
			vx: 0,
			vy: 0,
		})
	}
	particles.length = 0
}

const draw = () => {
	if (!ctx || !gridImageData || !gridBuffer || !offscreenCtx || !offscreenCanvas) return

	// Clear buffer (set to 0)
	gridBuffer.fill(0)

	// Render grid to buffer
	// We iterate grid cells and fill corresponding pixels in gridBuffer
	// This is the heavy part. Optimization: only draw active cells.
	// Since grid is 1/4 resolution, each cell is 4x4 pixels.
	// 4x4 = 16 pixels.
	// gridBuffer is w * h.

	// Color: white with some alpha? 0xAARRGGBB (little endian -> BBGGRRAA)
	// White 0.8 alpha -> 255, 255, 255, 204 -> 0xCCFFFFFF
	const color = 0xccffffff

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			if (grid[y * cols + x]) {
				// Fill 4x4 block
				const startX = x * CELL_SIZE
				const startY = y * CELL_SIZE
				// Boundary check
				const endX = Math.min(startX + CELL_SIZE, w)
				const endY = Math.min(startY + CELL_SIZE, h)

				for (let py = startY; py < endY; py++) {
					const rowOffset = py * w
					for (let px = startX; px < endX; px++) {
						gridBuffer[rowOffset + px] = color
					}
				}
			}
		}
	}

	// Put data to offscreen context
	offscreenCtx.putImageData(gridImageData, 0, 0)

	// Clear main canvas
	ctx.clearRect(0, 0, w, h)

	// Draw offscreen canvas to main canvas with blur
	ctx.save()
	ctx.filter = "blur(2px)"
	ctx.drawImage(offscreenCanvas, 0, 0)
	ctx.restore()

	// Draw falling flakes
	ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
	ctx.beginPath()
	const len = flakes.length
	for (let i = 0; i < len; i++) {
		const f = flakes[i]
		if (!f) continue
		ctx.moveTo(f.x, f.y)
		ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true)
	}
	// Draw particles
	const pLen = particles.length
	for (let i = 0; i < pLen; i++) {
		const p = particles[i]
		if (!p) continue
		ctx.moveTo(p.x, p.y)
		ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true)
	}
	ctx.fill()

	update()
}

const update = () => {
	// Window movement inertia
	const screenX = window.screenX ?? window.screenLeft
	const screenY = window.screenY ?? window.screenTop

	// Calculate delta but clamp it to avoid massive jumps (e.g. monitor switch)
	const rawVx = screenX - lastScreenX
	const rawVy = screenY - lastScreenY
	const winVx = Math.max(-50, Math.min(50, rawVx))
	const winVy = Math.max(-50, Math.min(50, rawVy))

	lastScreenX = screenX
	lastScreenY = screenY

	// Accumulate "wind" from window movement
	if (Math.abs(winVx) > 0 || Math.abs(winVy) > 0) {
		windowWindX += winVx * 0.5
		windowWindY += winVy * 0.5
	}

	// Decay window wind
	windowWindX *= 0.9
	windowWindY *= 0.9

	// Cellular Automata Update (Falling Sand)
	// Iterate from bottom to top
	for (let y = rows - 2; y >= 0; y--) {
		// Randomize x direction to avoid bias
		const startX = Math.random() > 0.5 ? 0 : cols - 1
		const step = startX === 0 ? 1 : -1

		for (let x = startX; x >= 0 && x < cols; x += step) {
			const idx = y * cols + x
			if (grid[idx]) {
				const belowIdx = (y + 1) * cols + x
				// Try to move down
				if (grid[belowIdx] === 0) {
					grid[belowIdx] = 1
					grid[idx] = 0
				} else {
					// Try to move diagonal
					const leftIdx = (y + 1) * cols + (x - 1)
					const rightIdx = (y + 1) * cols + (x + 1)
					const canLeft = x > 0 && grid[leftIdx] === 0
					const canRight = x < cols - 1 && grid[rightIdx] === 0

					if (canLeft && canRight) {
						if (Math.random() > 0.5) {
							grid[leftIdx] = 1
							grid[idx] = 0
						} else {
							grid[rightIdx] = 1
							grid[idx] = 0
						}
					} else if (canLeft) {
						grid[leftIdx] = 1
						grid[idx] = 0
					} else if (canRight) {
						grid[rightIdx] = 1
						grid[idx] = 0
					}
				}
			}
		}
	}

	// Update global angle for sway
	angle += 0.01

	const len = flakes.length
	for (let i = 0; i < len; i++) {
		const f = flakes[i]
		if (!f) continue

		// Movement
		// Use global angle + flake density/random factor for unique sway
		// Apply velocity if any
		f.x += f.vx - windowWindX * 0.2 // Apply window wind
		f.y += f.vy - windowWindY * 0.2

		// Apply friction to velocity
		f.vx *= 0.95
		f.vy *= 0.95

		// Normal falling movement added to velocity
		// If velocity is high, gravity affects it less (simulated)
		// Actually, just add falling vector
		f.y += (Math.cos(angle + f.d) + 1 + f.r / 2) * props.speed
		f.x += Math.sin(angle + f.d) * 2 + props.wind

		// Wrap around sides
		if (f.x > w + 5 || f.x < -5) {
			if (f.x > w + 5) f.x = -5
			else f.x = w + 5
		}

		// Check collision with grid
		const gx = Math.floor(f.x / CELL_SIZE)
		const gy = Math.floor(f.y / CELL_SIZE)

		if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
			if (grid[gy * cols + gx]) {
				// Hit snow
				// Try to slide to the side first (smoothing)
				const leftIdx = gy * cols + (gx - 1)
				const rightIdx = gy * cols + (gx + 1)
				const canLeft = gx > 0 && grid[leftIdx] === 0
				const canRight = gx < cols - 1 && grid[rightIdx] === 0

				let placed = false
				if (canLeft && canRight) {
					if (Math.random() > 0.5) {
						grid[leftIdx] = 1
						placed = true
					} else {
						grid[rightIdx] = 1
						placed = true
					}
				} else if (canLeft) {
					grid[leftIdx] = 1
					placed = true
				} else if (canRight) {
					grid[rightIdx] = 1
					placed = true
				}

				if (!placed) {
					// Add to grid above
					const aboveIdx = Math.max(0, gy - 1) * cols + gx
					if (grid[aboveIdx] === 0) {
						grid[aboveIdx] = 1
						placed = true
					}
				}

				if (placed) {
					// Reset flake
					f.y = -10
					f.x = Math.random() * w
					f.vx = 0
					f.vy = 0
				}
			}
		}

		// Floor collision
		if (f.y > h) {
			// Add to bottom row of grid if possible
			const floorGx = Math.floor(f.x / CELL_SIZE)
			if (floorGx >= 0 && floorGx < cols) {
				const idx = (rows - 1) * cols + floorGx

				let placed = false
				if (grid[idx] === 0) {
					grid[idx] = 1
					placed = true
				} else {
					// Try to slide to neighbors at bottom first
					const leftIdx = (rows - 1) * cols + (floorGx - 1)
					const rightIdx = (rows - 1) * cols + (floorGx + 1)
					const canLeft = floorGx > 0 && grid[leftIdx] === 0
					const canRight = floorGx < cols - 1 && grid[rightIdx] === 0

					if (canLeft && canRight) {
						if (Math.random() > 0.5) {
							grid[leftIdx] = 1
							placed = true
						} else {
							grid[rightIdx] = 1
							placed = true
						}
					} else if (canLeft) {
						grid[leftIdx] = 1
						placed = true
					} else if (canRight) {
						grid[rightIdx] = 1
						placed = true
					} else {
						// Try to stack
						let stackY = rows - 1
						while (stackY >= 0 && grid[stackY * cols + floorGx]) {
							stackY--
						}
						if (stackY >= 0) {
							grid[stackY * cols + floorGx] = 1
							placed = true
						}
					}
				}

				if (placed) {
					f.y = -10
					f.x = Math.random() * w
					f.vx = 0
					f.vy = 0
				}
			} else {
				f.y = -10
				f.x = Math.random() * w
				f.vx = 0
				f.vy = 0
			}
		}
	}

	// Update particles
	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i]
		if (!p) continue
		p.x += p.vx - windowWindX * 0.2
		p.y += p.vy - windowWindY * 0.2
		p.vy += 0.2 // gravity
		p.vx *= 0.99 // air resistance

		// Remove if out of bounds
		if (p.x < 0 || p.x > w || p.y > h + 50) {
			particles.splice(i, 1)
			continue
		}

		// If particle hits grid, turn into grid cell
		const pgx = Math.floor(p.x / CELL_SIZE)
		const pgy = Math.floor(p.y / CELL_SIZE)

		if (pgx >= 0 && pgx < cols && pgy >= 0 && pgy < rows) {
			if (grid[pgy * cols + pgx]) {
				// Hit existing snow, stack on top
				const aboveIdx = Math.max(0, pgy - 1) * cols + pgx
				if (grid[aboveIdx] === 0) {
					grid[aboveIdx] = 1
					particles.splice(i, 1)
				}
			} else if (pgy === rows - 1) {
				// Hit floor
				grid[pgy * cols + pgx] = 1
				particles.splice(i, 1)
			}
		}
	}
}

const removeSnowAt = (mx: number, my: number, vx: number = 0, vy: number = 0) => {
	const brushRadius = 100
	const startX = Math.max(0, Math.floor((mx - brushRadius) / CELL_SIZE))
	const endX = Math.min(cols, Math.ceil((mx + brushRadius) / CELL_SIZE))
	const startY = Math.max(0, Math.floor((my - brushRadius) / CELL_SIZE))
	const endY = Math.min(rows, Math.ceil((my + brushRadius) / CELL_SIZE))

	const radiusSq = (brushRadius / CELL_SIZE) ** 2

	for (let y = startY; y < endY; y++) {
		for (let x = startX; x < endX; x++) {
			const dx = x - mx / CELL_SIZE
			const dy = y - my / CELL_SIZE
			if (dx * dx + dy * dy < radiusSq) {
				const idx = y * cols + x
				if (grid[idx]) {
					grid[idx] = 0
					// Spawn particle
					if (Math.random() > 0.8) {
						particles.push({
							x: x * CELL_SIZE,
							y: y * CELL_SIZE,
							r: Math.random() * 2 + 1,
							d: 0,
							a: 0,
							vx: (Math.random() - 0.5) * 4 + vx * 0.1,
							vy: (Math.random() - 1) * 4 + vy * 0.1,
						})
					}
				}
			}
		}
	}

	// Repel falling flakes
	const len = flakes.length
	for (let i = 0; i < len; i++) {
		const f = flakes[i]
		if (!f) continue
		const dx = f.x - mx
		const dy = f.y - my
		const dist = Math.sqrt(dx * dx + dy * dy)
		if (dist < brushRadius * 1.5) {
			const force = (brushRadius * 1.5 - dist) / (brushRadius * 1.5)
			f.vx += (dx / dist) * force * 5
			f.vy += (dy / dist) * force * 5
		}
	}
}

let lastMx = 0
let lastMy = 0
const onMouseMove = (e: MouseEvent) => {
	const vx = e.clientX - lastMx
	const vy = e.clientY - lastMy
	removeSnowAt(e.clientX, e.clientY, vx, vy)
	lastMx = e.clientX
	lastMy = e.clientY
}

const onTouchMove = (e: TouchEvent) => {
	for (let i = 0; i < e.touches.length; i++) {
		const t = e.touches[i]
		if (t) {
			// Simple velocity approximation could be added here if needed
			removeSnowAt(t.clientX, t.clientY)
		}
	}
}

onMounted(() => {
	init()
	// draw() - handled by useRafFn
	window.addEventListener("mousemove", onMouseMove)
	window.addEventListener("touchmove", onTouchMove)
})

onUnmounted(() => {
	pause()
	window.removeEventListener("mousemove", onMouseMove)
	window.removeEventListener("touchmove", onTouchMove)
})

watch(
	() => props.count,
	() => {
		init()
	}
)

watch([winWidth, winHeight], () => {
	init()
})
</script>

<template>
	<canvas ref="canvasRef" class="snow-canvas"></canvas>
</template>

<style scoped>
.snow-canvas {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	pointer-events: none;
	z-index: 9999;
}
</style>
