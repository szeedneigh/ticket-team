"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      const main = document.querySelector('main')
      if (main && main.scrollTop > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    const main = document.querySelector('main')
    main?.addEventListener('scroll', toggleVisibility)

    return () => main?.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    const main = document.querySelector('main')
    main?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            duration: 0.2,
            ease: [0.2, 0.7, 0.2, 1]
          }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="group relative h-12 w-12 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
            aria-label="Back to top"
          >
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowUp className="h-5 w-5" />
            </motion.div>
            {/* Ripple effect on hover */}
            <span className="absolute inset-0 rounded-full bg-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
