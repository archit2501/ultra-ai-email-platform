import { Variants, Transition } from "framer-motion"

/**
 * Metaminds Animation Library
 * Reusable animation variants for consistent motion across the app
 */

// ========================================
// TIMING FUNCTIONS
// ========================================

export const transitions = {
  // Smooth and natural
  smooth: {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  } as Transition,

  // Bouncy and playful
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  } as Transition,

  // Quick and responsive
  snappy: {
    type: "tween",
    ease: [0.4, 0, 0.2, 1],
    duration: 0.2,
  } as Transition,

  // Slow and deliberate
  slow: {
    type: "tween",
    ease: "easeInOut",
    duration: 0.6,
  } as Transition,
}

// ========================================
// FADE ANIMATIONS
// ========================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.smooth,
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.smooth,
  },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.smooth,
  },
}

// ========================================
// SCALE ANIMATIONS
// ========================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
}

export const scaleInCenter: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.snappy,
  },
}

export const scaleOut: Variants = {
  visible: { opacity: 1, scale: 1 },
  hidden: {
    opacity: 0,
    scale: 0.8,
    transition: transitions.snappy,
  },
}

// ========================================
// SLIDE ANIMATIONS
// ========================================

export const slideInUp: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: transitions.spring,
  },
}

export const slideInDown: Variants = {
  hidden: { y: "-100%" },
  visible: {
    y: 0,
    transition: transitions.spring,
  },
}

export const slideInLeft: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: transitions.spring,
  },
}

export const slideInRight: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: transitions.spring,
  },
}

// ========================================
// STAGGER ANIMATIONS (For Lists)
// ========================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
}

export const staggerItemFast: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.snappy,
  },
}

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
}

// ========================================
// PAGE TRANSITIONS
// ========================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  },
}

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const pageSlideUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: { duration: 0.3 },
  },
}

// ========================================
// SPECIAL EFFECTS
// ========================================

export const glowPulse: Variants = {
  initial: { opacity: 0.6, scale: 1 },
  animate: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const floatAnimation: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -180, scale: 0 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
}

export const shimmer: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

// ========================================
// HOVER & TAP INTERACTIONS
// ========================================

export const hoverScale = {
  scale: 1.05,
  transition: transitions.snappy,
}

export const tapScale = {
  scale: 0.95,
  transition: transitions.snappy,
}

export const hoverGlow = {
  boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
  transition: transitions.smooth,
}

export const hoverLift = {
  y: -4,
  transition: transitions.spring,
}

// ========================================
// MODAL/DIALOG ANIMATIONS
// ========================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
}

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

// ========================================
// NOTIFICATION/TOAST ANIMATIONS
// ========================================

export const notificationSlideIn: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// ========================================
// CARD ANIMATIONS
// ========================================

export const cardHover = {
  y: -8,
  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  transition: transitions.spring,
}

export const cardTap = {
  scale: 0.98,
  transition: transitions.snappy,
}

// ========================================
// LOADING ANIMATIONS
// ========================================

export const pulseAnimation: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const spinAnimation: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create a stagger container with custom delay
 */
export const createStaggerContainer = (
  staggerDelay: number = 0.1,
  delayChildren: number = 0
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
})

/**
 * Create a custom page transition
 */
export const createPageTransition = (
  duration: number = 0.4,
  yOffset: number = 20
): Variants => ({
  initial: { opacity: 0, y: yOffset },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -yOffset,
    transition: {
      duration: duration * 0.75,
    },
  },
})
