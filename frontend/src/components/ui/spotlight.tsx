"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  size?: number;
  blur?: number;
}

export function Spotlight({
  children,
  className,
  spotlightColor = "rgba(59, 130, 246, 0.15)",
  size = 400,
  blur = 80,
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("relative overflow-hidden", className)}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${size}px circle at ${smoothX}px ${smoothY}px, ${spotlightColor}, transparent ${blur}%)`,
        }}
      />
      {children}
    </div>
  );
}

// Spotlight card that follows mouse
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightClassName?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightClassName,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-px transition-opacity duration-300",
          spotlightClassName
        )}
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
        }}
      />
      {isFocused && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity: 1,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.2), transparent 40%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

// Animated gradient border spotlight
interface GradientBorderSpotlightProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  gradientColors?: string[];
}

export function GradientBorderSpotlight({
  children,
  className,
  borderWidth = 1,
  gradientColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#3b82f6"],
}: GradientBorderSpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={cn("group relative rounded-xl p-px overflow-hidden", className)}
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, ${gradientColors.join(", ")})`,
        }}
      />

      {/* Static gradient fallback */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-0 transition-opacity duration-500" />

      {/* Inner content container */}
      <div
        className="relative rounded-xl bg-slate-900 overflow-hidden"
        style={{ margin: borderWidth }}
      >
        {children}
      </div>
    </div>
  );
}

// Mouse follow glow effect for backgrounds
interface MouseGlowProps {
  className?: string;
  glowColor?: string;
  glowSize?: number;
}

export function MouseGlow({
  className,
  glowColor = "rgba(59, 130, 246, 0.3)",
  glowSize = 600,
}: MouseGlowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-30 transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        background: `radial-gradient(${glowSize}px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 80%)`,
      }}
    />
  );
}

// Spotlight reveal effect for text/content
interface SpotlightRevealProps {
  children: React.ReactNode;
  className?: string;
  revealColor?: string;
}

export function SpotlightReveal({
  children,
  className,
  revealColor = "rgba(255, 255, 255, 0.1)",
}: SpotlightRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Base content (dimmed) */}
      <div className="opacity-60 transition-opacity duration-300">
        {children}
      </div>

      {/* Revealed content */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          clipPath: `circle(150px at ${position.x}px ${position.y}px)`,
        }}
        animate={{
          clipPath: isHovered
            ? `circle(150px at ${position.x}px ${position.y}px)`
            : `circle(0px at ${position.x}px ${position.y}px)`,
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
