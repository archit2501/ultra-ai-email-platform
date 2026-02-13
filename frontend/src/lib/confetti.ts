import confetti from "canvas-confetti"

/**
 * Metaminds Confetti Library
 * Celebration effects for user achievements and success states
 */

// ========================================
// BASIC CONFETTI
// ========================================

/**
 * Basic confetti burst
 */
export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  })
}

/**
 * Confetti from a specific element
 */
export function fireConfettiFrom(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x, y },
  })
}

// ========================================
// THEMED CONFETTI
// ========================================

/**
 * Success confetti (green)
 */
export function successConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#10b981", "#34d399", "#6ee7b7"],
  })
}

/**
 * Error confetti (red sparks)
 */
export function errorConfetti() {
  confetti({
    particleCount: 50,
    spread: 50,
    origin: { y: 0.6 },
    colors: ["#ef4444", "#f87171", "#fca5a5"],
    startVelocity: 30,
    ticks: 60,
  })
}

/**
 * Info confetti (blue)
 */
export function infoConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 },
    colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
  })
}

/**
 * Warning confetti (orange/yellow)
 */
export function warningConfetti() {
  confetti({
    particleCount: 60,
    spread: 50,
    origin: { y: 0.6 },
    colors: ["#f59e0b", "#fbbf24", "#fde047"],
  })
}

// ========================================
// SPECIAL EFFECTS
// ========================================

/**
 * Firework effect
 */
export function firework(x: number = Math.random(), y: number = Math.random()) {
  const count = 200
  const defaults = {
    origin: { x, y },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

/**
 * Side cannons effect
 */
export function sideCannons() {
  const end = Date.now() + 3 * 1000 // 3 seconds

  const colors = ["#3b82f6", "#8b5cf6", "#ec4899"]

  ;(function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    })

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

/**
 * Realistic confetti burst
 */
export function realisticConfetti() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })

  fire(0.2, {
    spread: 60,
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

/**
 * Snow effect
 */
export function snow() {
  const duration = 5 * 1000
  const animationEnd = Date.now() + duration
  let skew = 1

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  ;(function frame() {
    const timeLeft = animationEnd - Date.now()
    const ticks = Math.max(200, 500 * (timeLeft / duration))

    skew = Math.max(0.8, skew - 0.001)

    confetti({
      particleCount: 1,
      startVelocity: 0,
      ticks: ticks,
      origin: {
        x: Math.random(),
        y: Math.random() * skew - 0.2,
      },
      colors: ["#ffffff"],
      shapes: ["circle"],
      gravity: randomInRange(0.4, 0.6),
      scalar: randomInRange(0.4, 1),
      drift: randomInRange(-0.4, 0.4),
    })

    if (timeLeft > 0) {
      requestAnimationFrame(frame)
    }
  })()
}

/**
 * Stars effect
 */
export function stars() {
  const defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ["star"],
    colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
  }

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ["star"],
    })

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ["circle"],
    })
  }

  setTimeout(shoot, 0)
  setTimeout(shoot, 100)
  setTimeout(shoot, 200)
}

/**
 * Emoji blast
 */
export function emojiBlast(emoji: string = "🎉") {
  const scalar = 2
  const shapes = confetti.shapeFromText({ text: emoji, scalar })

  confetti({
    particleCount: 30,
    spread: 100,
    startVelocity: 30,
    shapes: [shapes],
    scalar,
  })
}

/**
 * School pride effect (continuous)
 */
export function schoolPride() {
  const end = Date.now() + 2 * 1000 // 2 seconds
  const colors = ["#3b82f6", "#8b5cf6"]

  ;(function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    })
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

/**
 * Random fireworks
 */
export function randomFireworks(count: number = 3) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const x = Math.random()
      const y = Math.random() * 0.5 + 0.2 // Keep in upper half
      firework(x, y)
    }, i * 300)
  }
}

/**
 * Celebration (multi-effect)
 */
export function celebrate() {
  realisticConfetti()
  setTimeout(() => stars(), 200)
  setTimeout(() => randomFireworks(2), 500)
}
