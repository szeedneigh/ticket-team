'use client'

import type { ReactElement } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

export function Robot(): ReactElement {
  const reduce = useReducedMotion()

  return (
    <div
      aria-hidden
      className="hidden lg:block absolute left-4 top-1/3 -translate-y-1/2 z-10 h-[80vh] max-h-[640px] w-[80vh]"
    >
      <motion.div
        className="relative h-full w-full will-change-transform"
        style={{ transformOrigin: '55% 55%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={
          reduce
            ? { opacity: 1, y: 0 }
            : {
                opacity: 1,
                y: 0,
              }
        }
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          animate={
            reduce
              ? {}
              : {
                  y: [0, -20, 0],
                  rotate: [-2, 2, -2],
                }
          }
          transition={{
            delay: 0.8,
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '55% 55%' }}
          className="relative h-full w-full"
        >
          {/* Subtle pulsing glow effect */}
          {!reduce && (
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl opacity-30"
              animate={{
                backgroundColor: ['rgba(44, 175, 221, 0.3)', 'rgba(31, 52, 99, 0.2)', 'rgba(44, 175, 221, 0.3)'],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
          <Image
            src="/assets/timi-bot1.svg"
            alt="Timi Assistant"
            fill
            priority
            className="object-contain drop-shadow-2xl relative z-10"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}


