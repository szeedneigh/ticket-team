'use client'

import Image from "next/image";
import { motion } from 'framer-motion'
import { Robot } from "@/components/shared/Robot";
import { Footer } from "@/components/shared/footer";

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
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-gradient-to-br from-[#d4e8f0] via-[#e8f4f8] to-[#0a4d7e]">
      
      {/* Background waves*/}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="absolute inset-0 bg-[url('/assets/curvy-bg1.svg')] bg-no-repeat bg-left-top bg-[length:50%_100%] md:bg-[length:45%_100%] lg:bg-[length:40%_100%]" />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="absolute inset-0 bg-[url('/assets/curvy-bg2.svg')] bg-no-repeat bg-right-top bg-[length:50%_100%] md:bg-[length:45%_100%] lg:bg-[length:40%_100%]" />
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
              href="/auth/sign-in"
              className="w-full inline-flex items-center justify-center gap-3 rounded-[20px] px-8 py-4 text-[18px] md:text-[20px] font-semibold text-white bg-[linear-gradient(90deg,#002C64_53.85%,#0059CA_100%)] shadow-lg hover:opacity-90 transition-all duration-200"
            >
              Log In
            </a>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </section>
  );
}
