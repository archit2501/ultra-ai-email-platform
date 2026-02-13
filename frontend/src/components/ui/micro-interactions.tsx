"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"
import * as confettiLib from "@/lib/confetti"

// ========================================
// RIPPLE EFFECT
// ========================================

interface RippleProps {
  children: React.ReactNode
  className?: string
  rippleColor?: string
}

/**
 * Adds Material Design ripple effect on click
 */
export function Ripple({ children, className, rippleColor = "rgba(255, 255, 255, 0.5)" }: RippleProps) {
  const [ripples, setRipples] = React.useState<
    Array<{ x: number; y: number; id: number }>
  >([])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { x, y, id }])

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
    }, 600)
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            backgroundColor: rippleColor,
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{
            width: 400,
            height: 400,
            opacity: 0,
            x: -200,
            y: -200,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </div>
  )
}

// ========================================
// BUTTON WITH RIPPLE
// ========================================

interface RippleButtonProps extends ButtonProps {
  rippleColor?: string
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, className, rippleColor, ...props }, ref) => {
    return (
      <Ripple rippleColor={rippleColor}>
        <Button ref={ref} className={className} {...props}>
          {children}
        </Button>
      </Ripple>
    )
  }
)
RippleButton.displayName = "RippleButton"

// ========================================
// SUCCESS CHECKMARK ANIMATION
// ========================================

interface SuccessCheckmarkProps {
  size?: number
  className?: string
  onComplete?: () => void
}

/**
 * Animated success checkmark (circle draws, then checkmark appears)
 */
export function SuccessCheckmark({
  size = 64,
  className,
  onComplete,
}: SuccessCheckmarkProps) {
  React.useEffect(() => {
    if (onComplete) {
      setTimeout(onComplete, 1000)
    }
  }, [onComplete])

  return (
    <motion.div
      className={cn("inline-block", className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <svg width={size} height={size} viewBox="0 0 52 52">
        <motion.circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-success"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <motion.path
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-success"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  )
}

// ========================================
// CONFETTI BUTTON
// ========================================

interface ConfettiButtonProps extends ButtonProps {
  confettiType?: keyof typeof confettiLib
  onConfetti?: () => void
}

/**
 * Button that triggers confetti on click
 */
export const ConfettiButton = React.forwardRef<
  HTMLButtonElement,
  ConfettiButtonProps
>(({ children, confettiType = "fireConfetti", onConfetti, onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Fire confetti
    const confettiFunction = confettiLib[confettiType]
    if (typeof confettiFunction === "function") {
      (confettiFunction as () => void)()
    }

    // Call callbacks
    onConfetti?.()
    onClick?.(e)
  }

  return (
    <Button ref={ref} onClick={handleClick} {...props}>
      {children}
    </Button>
  )
})
ConfettiButton.displayName = "ConfettiButton"

// ========================================
// SUCCESS BUTTON (Loading → Success Animation)
// ========================================

interface SuccessButtonProps extends Omit<ButtonProps, "onClick"> {
  onSuccess?: () => Promise<void> | void
  successDuration?: number
  successText?: string
  loadingText?: string
}

/**
 * Button with loading → success → normal flow
 */
export function SuccessButton({
  children,
  onSuccess,
  successDuration = 2000,
  successText = "Success!",
  loadingText = "Loading...",
  disabled,
  ...props
}: SuccessButtonProps) {
  const [state, setState] = React.useState<"idle" | "loading" | "success">("idle")

  const handleClick = async () => {
    if (state !== "idle") return

    setState("loading")

    try {
      await onSuccess?.()
      setState("success")
      confettiLib.successConfetti()

      setTimeout(() => {
        setState("idle")
      }, successDuration)
    } catch (error) {
      setState("idle")
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || state !== "idle"}
      {...props}
    >
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        )}
        {state === "loading" && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </motion.span>
        )}
        {state === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {successText}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}

// ========================================
// MAGNETIC BUTTON (Follows cursor)
// ========================================

interface MagneticButtonProps extends ButtonProps {
  strength?: number
}

/**
 * Button that magnetically follows the cursor
 */
export const MagneticButton = React.forwardRef<
  HTMLButtonElement,
  MagneticButtonProps
>(({ children, strength = 0.3, className, ...props }, ref) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  React.useImperativeHandle(ref, () => buttonRef.current!)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    setPosition({ x: deltaX, y: deltaY })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      animate={position}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
    >
      <Button
        ref={buttonRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={className}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
})
MagneticButton.displayName = "MagneticButton"

// ========================================
// LIKE BUTTON (Heart Animation)
// ========================================

interface LikeButtonProps {
  liked?: boolean
  onLike?: (liked: boolean) => void
  className?: string
}

/**
 * Animated like button with heart
 */
export function LikeButton({ liked = false, onLike, className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = React.useState(liked)

  const handleClick = () => {
    const newState = !isLiked
    setIsLiked(newState)
    onLike?.(newState)

    if (newState) {
      confettiLib.emojiBlast("❤️")
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        "relative inline-flex items-center justify-center p-2 rounded-full transition-colors",
        isLiked
          ? "text-error bg-error/10"
          : "text-muted-foreground hover:text-error hover:bg-error/5",
        className
      )}
      whileTap={{ scale: 0.9 }}
    >
      <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </motion.svg>
      <AnimatePresence>
        {isLiked && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full rounded-full border-2 border-error" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ========================================
// SHAKE ANIMATION (Error Feedback)
// ========================================

interface ShakeProps {
  children: React.ReactNode
  trigger: boolean
  onShakeEnd?: () => void
}

/**
 * Shakes content when triggered (useful for error states)
 */
export function Shake({ children, trigger, onShakeEnd }: ShakeProps) {
  const controls = React.useRef({ x: 0 })

  React.useEffect(() => {
    if (trigger) {
      setTimeout(() => onShakeEnd?.(), 500)
    }
  }, [trigger, onShakeEnd])

  return (
    <motion.div
      animate={trigger ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
