"use client"

import * as React from "react"
import { motion, useInView, HTMLMotionProps } from "framer-motion"
import {
  pageTransition,
  staggerContainer,
  staggerItem,
  fadeInUp,
  scaleIn,
  cardHover,
  cardTap,
  hoverScale,
  tapScale,
} from "@/lib/animations"
import { cn } from "@/lib/utils"

// ========================================
// ANIMATED PAGE WRAPPER
// ========================================

interface AnimatedPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
}

/**
 * Wraps page content with entrance/exit animations
 * Use at the root of each page component
 */
export function AnimatedPage({
  children,
  className,
  ...props
}: AnimatedPageProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// ANIMATED LIST (STAGGER)
// ========================================

interface AnimatedListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  delayChildren?: number
}

/**
 * Container for staggered animations
 * Children will animate in sequence
 */
export function AnimatedList({
  children,
  className,
  staggerDelay = 0.1,
  delayChildren = 0,
}: AnimatedListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        ...staggerContainer,
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Individual item in a staggered list
 * Must be a child of AnimatedList
 */
export function AnimatedListItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  )
}

// ========================================
// SCROLL REVEAL
// ========================================

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  animation?: "fade" | "slide" | "scale"
  delay?: number
  once?: boolean
}

/**
 * Reveals content when it scrolls into view
 * Respects prefers-reduced-motion
 */
export function ScrollReveal({
  children,
  className,
  animation = "fade",
  delay = 0,
  once = true,
}: ScrollRevealProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once, amount: 0.3 })

  const variants = {
    fade: fadeInUp,
    slide: fadeInUp,
    scale: scaleIn,
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants[animation]}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// ANIMATED CARD
// ========================================

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  hoverEffect?: "lift" | "scale" | "glow" | "none"
}

/**
 * Card with hover and tap animations
 */
export function AnimatedCard({
  children,
  className,
  hoverEffect = "lift",
  ...props
}: AnimatedCardProps) {
  const hoverVariants = {
    lift: cardHover,
    scale: hoverScale,
    glow: { scale: 1.02, boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" },
    none: {},
  }

  return (
    <motion.div
      whileHover={hoverVariants[hoverEffect]}
      whileTap={cardTap}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// FADE IN
// ========================================

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}

/**
 * Simple fade in animation
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  ...props
}: FadeInProps) {
  const variants = {
    up: { opacity: 0, y: 20 },
    down: { opacity: 0, y: -20 },
    left: { opacity: 0, x: -20 },
    right: { opacity: 0, x: 20 },
    none: { opacity: 0 },
  }

  return (
    <motion.div
      initial={variants[direction]}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// SCALE IN
// ========================================

interface ScaleInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  delay?: number
}

/**
 * Scale in animation (pop effect)
 */
export function ScaleIn({
  children,
  className,
  delay = 0,
  ...props
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// HOVER/TAP WRAPPER
// ========================================

interface InteractiveProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
}

/**
 * Adds hover and tap scale animations
 */
export function Interactive({
  children,
  className,
  ...props
}: InteractiveProps) {
  return (
    <motion.div
      whileHover={hoverScale}
      whileTap={tapScale}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// ANIMATED PRESENCE WRAPPER
// ========================================

interface AnimatedPresenceWrapperProps {
  children: React.ReactNode
  isVisible: boolean
  className?: string
}

/**
 * Animates mount/unmount of conditional content
 */
export function AnimatedPresenceWrapper({
  children,
  isVisible,
  className,
}: AnimatedPresenceWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={
        isVisible
          ? { opacity: 1, height: "auto" }
          : { opacity: 0, height: 0 }
      }
      transition={{ duration: 0.3 }}
      className={cn("overflow-hidden", className)}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// FLOAT ANIMATION
// ========================================

interface FloatProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  amplitude?: number
  duration?: number
}

/**
 * Continuous floating animation
 */
export function Float({
  children,
  className,
  amplitude = 10,
  duration = 3,
  ...props
}: FloatProps) {
  return (
    <motion.div
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// PULSE ANIMATION
// ========================================

interface PulseProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  duration?: number
}

/**
 * Continuous pulse animation (opacity)
 */
export function Pulse({
  children,
  className,
  duration = 2,
  ...props
}: PulseProps) {
  return (
    <motion.div
      animate={{
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// SLIDE IN
// ========================================

interface SlideInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right"
  delay?: number
}

/**
 * Slide in from a direction
 */
export function SlideIn({
  children,
  className,
  direction = "up",
  delay = 0,
  ...props
}: SlideInProps) {
  const initial = {
    up: { y: "100%", opacity: 0 },
    down: { y: "-100%", opacity: 0 },
    left: { x: "-100%", opacity: 0 },
    right: { x: "100%", opacity: 0 },
  }

  return (
    <motion.div
      initial={initial[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
