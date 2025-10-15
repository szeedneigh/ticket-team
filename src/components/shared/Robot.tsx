'use client'

import type { ReactElement } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

export function Robot(): ReactElement {
  const reduce = useReducedMotion()

  const floatAnim = reduce
    ? {}
    : {
        y: [8, -20, 8],
        rotate: [-2, 2, -2],
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      }

  return (
    <div
      aria-hidden
      className="hidden lg:block absolute left-4 top-1/3 -translate-y-1/2 z-10 h-[80vh] max-h-[640px] w-[80vh]"
    >
      <motion.div
        className="relative h-full w-full will-change-transform"
        style={{ transformOrigin: '55% 55%' }}
        animate={floatAnim}
        whileHover={{ scale: 1.03 }}
      >
        <Image
          src="/assets/timi-bot1.svg"
          alt="Timi Assistant"
          fill
          priority
          className="object-contain drop-shadow-2xl"
        />
      </motion.div>
    </div>
  )
}


