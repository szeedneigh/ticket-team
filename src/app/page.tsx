'use client'

import Image from "next/image";
import Link from "next/link";
import { motion } from 'framer-motion'
import { Robot } from "@/components/shared/Robot";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  }

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-gradient-to-br from-[#d4e8f0] via-[#e8f4f8] to-[#0a4d7e]">
      {/* Dev Link to Component Test Page */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Link
          href="/test-components"
          className="absolute top-4 right-4 z-50 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-white transition-colors"
        >
          🧪 Test Components
        </Link>
      </motion.div>

      {/* Background waves*/}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[54vw] min-w-[360px] z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-[url('/assets/curvy-bg1.svg')] bg-no-repeat bg-left [background-size:100%]" />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[54vw] min-w-[360px] z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-[url('/assets/curvy-bg2.svg')] bg-no-repeat bg-right [background-size:60%]" />
      </motion.div>

      {/* Timi Assistant*/}
      <Robot />

      {/* Main card */}
      <div className="relative z-10 grid place-content-center min-h-[100svh] p-6 md:ml-8">
        <motion.div
          className="w-full max-w-[600px] rounded-[40px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-10 md:p-14"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div
            className="mx-auto mb-6 flex items-center justify-center"
            variants={itemVariants}
          >
            <Image
              src="/assets/lv-logo.svg"
              alt="La Verdad Christian College"
              width={80}
              height={80}
              className="drop-shadow-sm"
            />
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-center text-[28px] md:text-[32px] font-normal text-black"
            variants={itemVariants}
          >
            Hi{" "}
            <span className="text-[#0693D2] font-semibold">La Verdarian</span> !
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="mt-2 text-center text-[32px] md:text-[36px] font-normal text-black leading-tight"
            variants={itemVariants}
          >
            Welcome to Ticket-Team
          </motion.p>

          {/* Description */}
          <motion.p
            className="mt-6 text-center text-[14px] md:text-[15px] text-gray-600 leading-relaxed px-4"
            variants={itemVariants}
          >
            You can now create a ticket anytime to request MIS assistance
            efficiently.
            <br />
            Track and resolve concerns faster
          </motion.p>

          {/* CTA Button */}
          <motion.div
            className="mt-10 flex justify-center"
            variants={itemVariants}
          >
            <a
              href="/login"
              className="w-full inline-flex items-center justify-center gap-3 rounded-[20px] px-8 py-4 text-[18px] md:text-[20px] font-semibold text-white bg-[#003B73] shadow-lg hover:bg-[#002C5A] transition-all duration-200"
            >
              Get Started
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
