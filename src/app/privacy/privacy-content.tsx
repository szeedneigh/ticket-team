'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, FileText, Database, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

const sections = [
  { id: 'introduction', title: 'Introduction', icon: Shield },
  { id: 'collection', title: 'Information We Collect', icon: Eye },
  { id: 'usage', title: 'How We Use Information', icon: Database },
  { id: 'security', title: 'Data Security', icon: Lock },
  { id: 'contact', title: 'Contact Us', icon: FileText },
]

export function PrivacyContent() {
  const [activeSection, setActiveSection] = useState('introduction')

  // Handle scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -50% 0px' }
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Height of sticky header/nav
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative w-full pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[60]"
        style={{ scaleX: useSpring(useScroll().scrollYProgress, { stiffness: 100, damping: 30 }) }}
      />
      
      {/* Back Button - Fixed on Desktop */}
      <div className="absolute top-24 left-4 lg:left-8 z-40 hidden xl:block">
         <Button 
            variant="outline" 
            asChild 
            className="bg-white/50 backdrop-blur-md border-white/40 hover:bg-white/80 shadow-sm"
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Table of Contents - Sidebar */}
        <div className="lg:col-span-1 hidden lg:block relative">
           <div className="sticky top-28 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground/70 mb-4 px-3">
                Contents
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-primary/10 text-primary translate-x-1' 
                          : 'text-muted-foreground hover:bg-white/30 hover:text-foreground'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      {section.title}
                    </button>
                  )
                })}
              </nav>
              
              {/* Added visual flair */}
              <div className="mt-8 p-4 bg-gradient-to-br from-white/40 to-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Questions about your privacy?<br/>
                   <a href="mailto:support@ticket-team.lvcc.edu.ph" className="text-primary font-medium hover:underline">Contact our DPO</a>
                 </p>
              </div>
           </div>
        </div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Mobile Back & Title */}
           <div className="lg:hidden mb-6">
              <Button variant="ghost" asChild className="pl-0 mb-4 -ml-2">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
           </div>

           {/* Header Card */}
           <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/40 overflow-hidden">
               <div className="bg-white/50 border-b border-white/20 p-8 md:p-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <Shield className="w-64 h-64 text-primary" />
                   </div>
                  <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-brand-accent mb-4 relative z-10">
                    Privacy Policy
                  </h1>
                  <p className="text-lg text-muted-foreground relative z-10 max-w-2xl">
                    Transparency is our core value. Here's how Ticket Team protects and manages your data.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground font-medium relative z-10">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    Last Updated: December 2025
                  </div>
              </div>
           </div>
           
           {/* Section Cards */}
           <div className="space-y-6">
             {/* 1. Introduction */}
             <section id="introduction" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  1. Introduction
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Ticket Team, the intelligent helpdesk platform for La Verdad Christian College. 
                  Your privacy is important to us. It is Ticket Team's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.
                </p>
             </section>

             {/* 2. Collection */}
             <section id="collection" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-6">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  2. Information We Collect
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/40 p-5 rounded-xl border border-white/30 hover:bg-white/60 transition-colors">
                      <h3 className="font-semibold text-foreground mb-2 text-sm uppercase tracking-wide">Account Information</h3>
                      <p className="text-sm text-muted-foreground">
                        When you sign in using Google OAuth, we collect your name, email address, and profile picture to create and manage your account.
                      </p>
                    </div>
                    <div className="bg-white/40 p-5 rounded-xl border border-white/30 hover:bg-white/60 transition-colors">
                      <h3 className="font-semibold text-foreground mb-2 text-sm uppercase tracking-wide">Usage Data</h3>
                      <p className="text-sm text-muted-foreground">
                        We collect data about your interactions with the platform, such as ticket creation, knowledge base searches, and chat history.
                      </p>
                    </div>
                  </div>
                </div>
             </section>

             {/* 3. Usage */}
             <section id="usage" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  3. How We Use Your Information
                </h2>
                <div className="pl-2">
                  <ul className="grid gap-3">
                    {[
                      "To provide and maintain our Service.",
                      "To manage your specific Account and preferences.",
                      "To contact you regarding ticket updates or support.",
                      "To improve AI accuracy using anonymized data."
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
             </section>

             {/* 4. Security */}
             <section id="security" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                    <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  4. Data Security
                </h2>
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-xl border border-emerald-100/50 dark:border-emerald-800/20">
                  <p className="text-muted-foreground leading-relaxed">
                    We use industry-standard encryption and <strong>Row Level Security (RLS)</strong> to ensure that your data is only accessible to authorized personnel. 
                    While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.
                  </p>
                </div>
             </section>

             {/* 5. Contact */}
              <section id="contact" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                 <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    Contact Us
                  </h2>
                 <p className="text-muted-foreground mb-6">
                   If you have any questions about this Privacy Policy, please contact us:
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <a href="mailto:support@ticket-team.lvcc.edu.ph" className="flex items-center gap-3 p-4 bg-white/50 rounded-xl border border-white/30 hover:border-primary/50 transition-colors group">
                       <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                          <FileText className="w-5 h-5 text-primary" />
                       </div>
                       <div>
                          <p className="text-xs text-muted-foreground font-medium">Email Support</p>
                          <p className="text-sm font-semibold text-foreground">support@ticket-team.lvcc.edu.ph</p>
                       </div>
                    </a>
                 </div>
              </section>

           </div>

        </motion.div>
      </div>
    </div>
  )
}
