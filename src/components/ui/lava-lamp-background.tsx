"use client"

import React, { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LavaLampBackgroundProps {
  className?: string
}

export const LavaLampBackground: React.FC<LavaLampBackgroundProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const blobsCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Track mouse coordinates and active state
  const mouseRef = useRef({ x: 0, y: 0, active: false, targetX: 0, targetY: 0 })

  useEffect(() => {
    const blobsCanvas = blobsCanvasRef.current
    const particlesCanvas = particlesCanvasRef.current
    const container = containerRef.current
    if (!blobsCanvas || !particlesCanvas || !container) return

    const blobsCtx = blobsCanvas.getContext("2d")
    const particlesCtx = particlesCanvas.getContext("2d")
    if (!blobsCtx || !particlesCtx) return

    let animationFrameId: number
    let width = (blobsCanvas.width = particlesCanvas.width = container.clientWidth)
    let height = (blobsCanvas.height = particlesCanvas.height = container.clientHeight)

    // Handle Resize
    const handleResize = () => {
      if (!container || !blobsCanvas || !particlesCanvas) return
      width = blobsCanvas.width = particlesCanvas.width = container.clientWidth
      height = blobsCanvas.height = particlesCanvas.height = container.clientHeight
    }
    window.addEventListener("resize", handleResize)

    // Track mouse coordinates relative to container
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current.targetX = e.clientX - rect.left
      mouseRef.current.targetY = e.clientY - rect.top
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    // Attach to window so we track movement even outside the canvas boundaries
    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    // Lava Blobs configuration
    interface Blob {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: string
    }

    const brandColors = ["#008990", "#07BCCA"] // brand-teal, brand-cyan
    const blobs: Blob[] = []
    const blobCount = 6

    for (let i = 0; i < blobCount; i++) {
      const radius = Math.random() * 140 + 110 // 110px to 250px size
      blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius,
        color: brandColors[i % brandColors.length],
      })
    }

    // Particles configuration
    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      alpha: number
      color: string
      baseSpeedY: number
      angle: number
      angleSpeed: number
    }

    const particles: Particle[] = []
    const particleCount = 45

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2.2 + 0.8 // 0.8px to 3px
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        radius,
        alpha: Math.random() * 0.45 + 0.15,
        color: brandColors[Math.floor(Math.random() * brandColors.length)],
        baseSpeedY: -(Math.random() * 0.35 + 0.15), // drift upwards
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() - 0.5) * 0.015,
      })
    }

    // Smoothly initialize mouse position to center
    mouseRef.current.x = width / 2
    mouseRef.current.y = height / 2

    // Animation Loop
    const animate = () => {
      // 1. Smoothly interpolate mouse coordinates for a organic easing feel
      if (mouseRef.current.active) {
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08
      }

      // Clear frames
      blobsCtx.clearRect(0, 0, width, height)
      particlesCtx.clearRect(0, 0, width, height)

      // --- 2. UPDATE AND DRAW LAVA BLOBS ---
      blobs.forEach((blob) => {
        // Apply normal drift speed
        blob.x += blob.vx
        blob.y += blob.vy

        // Apply mouse gravity if mouse is active on the screen
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - blob.x
          const dy = mouseRef.current.y - blob.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 80) {
            // Pull blobs gently toward the cursor position
            blob.vx += (dx / dist) * 0.012
            blob.vy += (dy / dist) * 0.012
          }
        }

        // Apply speed limit to avoid blobs zooming away
        const speed = Math.sqrt(blob.vx * blob.vx + blob.vy * blob.vy)
        const maxSpeed = 1.0
        if (speed > maxSpeed) {
          blob.vx = (blob.vx / speed) * maxSpeed
          blob.vy = (blob.vy / speed) * maxSpeed
        }

        // Boundaries check (soft wraps with pad offset)
        const pad = blob.radius
        if (blob.x < -pad) blob.x = width + pad
        else if (blob.x > width + pad) blob.x = -pad

        if (blob.y < -pad) blob.y = height + pad
        else if (blob.y > height + pad) blob.y = -pad

        // Render soft radial gradient representing metaball core
        const grad = blobsCtx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius
        )
        // Smoothly fade out colors at the edge
        grad.addColorStop(0, blob.color)
        grad.addColorStop(0.5, blob.color + "a0") // semi-transparent hex alpha
        grad.addColorStop(1, "rgba(0, 0, 0, 0)")

        blobsCtx.fillStyle = grad
        blobsCtx.beginPath()
        blobsCtx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        blobsCtx.fill()
      })

      // Add a dynamic glowing ambient blob underneath the mouse
      if (mouseRef.current.active) {
        const grad = blobsCtx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          160
        )
        grad.addColorStop(0, "#07BCCA44") // translucent brand-cyan
        grad.addColorStop(0.7, "#00899011") // very translucent brand-teal
        grad.addColorStop(1, "rgba(0, 0, 0, 0)")
        blobsCtx.fillStyle = grad
        blobsCtx.beginPath()
        blobsCtx.arc(mouseRef.current.x, mouseRef.current.y, 160, 0, Math.PI * 2)
        blobsCtx.fill()
      }

      // --- 3. UPDATE AND DRAW CRISP FLOATING PARTICLES ---
      particles.forEach((p) => {
        // Natural sine-wave horizontal drift
        p.angle += p.angleSpeed
        const driftX = Math.sin(p.angle) * 0.12
        
        p.x += driftX
        p.y += p.baseSpeedY

        // Interaction: Swirling whirlpool force + gentle repulsion near mouse
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const influenceRadius = 160

          if (dist < influenceRadius) {
            const force = (1 - dist / influenceRadius) * 0.7
            
            // Get perpendicular direction for swirl motion
            const swirlX = -dy / (dist + 0.1)
            const swirlY = dx / (dist + 0.1)

            p.x += swirlX * force * 1.6
            p.y += swirlY * force * 1.6
            
            // Gentle repulsive force to disperse slightly
            p.x -= (dx / (dist + 0.1)) * force * 0.4
            p.y -= (dy / (dist + 0.1)) * force * 0.4
          }
        }

        // Particle Boundary wraps
        if (p.x < 0) p.x = width
        else if (p.x > width) p.x = 0

        if (p.y < 0) {
          p.y = height
          p.x = Math.random() * width
        }

        // Draw the crisp glow particle
        particlesCtx.fillStyle = p.color
        particlesCtx.globalAlpha = p.alpha
        particlesCtx.beginPath()
        particlesCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        particlesCtx.fill()
      })
      
      particlesCtx.globalAlpha = 1.0 // reset alpha

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden w-full h-full", className)}>
      {/* Lava Lamp Blobs Canvas - with heavy CSS blur to merge them together */}
      <canvas
        ref={blobsCanvasRef}
        className="absolute inset-0 w-full h-full opacity-55 mix-blend-screen blur-[60px] md:blur-[90px] pointer-events-none"
      />
      {/* Crisp floating particle Canvas */}
      <canvas
        ref={particlesCanvasRef}
        className="absolute inset-0 w-full h-full opacity-65 pointer-events-none"
      />
    </div>
  )
}
