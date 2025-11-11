import { useEffect, useState, useRef } from 'react'

/**
 * Hook for animating numbers from 0 to target value with easing
 * Perfect for dashboard stats and metrics
 *
 * @param end - Target number to count up to
 * @param duration - Animation duration in milliseconds (default: 1000ms)
 * @param enabled - Whether animation is enabled (default: true)
 * @returns The current animated count value
 *
 * @example
 * const count = useCountUp(42, 1500)
 * return <span>{count}</span>
 */
export function useCountUp(
  end: number,
  duration: number = 1000,
  enabled: boolean = true
): number {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    // If animation is disabled, immediately set to end value
    if (!enabled) {
      setCount(end)
      return
    }

    // Reset refs for new animation
    startTimeRef.current = undefined

    const animate = (currentTime: number) => {
      // Set start time on first frame
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      // Calculate progress (0 to 1)
      const progress = Math.min((currentTime - startTimeRef.current) / duration, 1)

      // Ease out quart function for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      // Update count with eased value
      setCount(Math.floor(easeOutQuart * end))

      // Continue animation if not complete
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    // Start animation
    frameRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [end, duration, enabled])

  return count
}

/**
 * Hook for intersection observer-triggered count up animation
 * Starts animation when element becomes visible in viewport
 *
 * @param end - Target number to count up to
 * @param options - Intersection observer options
 * @returns [count, ref] - Current count and ref to attach to element
 *
 * @example
 * const [count, ref] = useCountUpOnView(100)
 * return <div ref={ref}>{count}</div>
 */
export function useCountUpOnView(
  end: number,
  options?: IntersectionObserverInit
): [number, (node: HTMLElement | null) => void] {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(ref)

    return () => observer.disconnect()
  }, [ref, options])

  const count = useCountUp(end, 1000, isVisible)

  return [count, setRef]
}
