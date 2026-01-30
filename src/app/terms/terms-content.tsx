'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, Scale, UserCheck, AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

const sections = [
  { id: 'introduction', title: 'Introduction', icon: FileText },
  { id: 'acceptance', title: 'Acceptance of Terms', icon: UserCheck },
  { id: 'use', title: 'Use of Service', icon: Scale },
  { id: 'conduct', title: 'User Conduct', icon: AlertCircle },
  { id: 'limitation', title: 'Limitation of Liability', icon: Shield },
]

export function TermsContent() {
  const [activeSection, setActiveSection] = useState('introduction')

  // Call hooks at top level of component
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

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
      const offset = 80
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
      
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[60]"
        style={{ scaleX }}
      />
      
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
              
              <div className="mt-8 p-4 bg-gradient-to-br from-white/40 to-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Questions about these terms?<br/>
                   <a href="mailto:support@ticket-team.lvcc.edu.ph" className="text-primary font-medium hover:underline">Contact Support</a>
                 </p>
              </div>
           </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-3 space-y-6"
        >
           <div className="lg:hidden mb-6">
              <Button variant="ghost" asChild className="pl-0 mb-4 -ml-2">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
           </div>

           <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/40 overflow-hidden">
               <div className="bg-white/50 border-b border-white/20 p-8 md:p-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <Scale className="w-64 h-64 text-primary" />
                   </div>
                  <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-brand-accent mb-4 relative z-10">
                    Terms of Service
                  </h1>
                  <p className="text-lg text-muted-foreground relative z-10 max-w-2xl">
                    Please read these terms carefully before using Ticket Team.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground font-medium relative z-10">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    Last Updated: January 2026
                  </div>
              </div>
           </div>
           
           <div className="space-y-6">
             <section id="introduction" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  1. Introduction
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Ticket Team. These Terms of Service (&quot;Terms&quot;) govern your use of the Ticket Team platform 
                  provided by La Verdad Christian College (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By accessing or using our service, 
                  you agree to be bound by these Terms.
                </p>
             </section>

             <section id="acceptance" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  2. Acceptance of Terms
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    By creating an account and using Ticket Team, you acknowledge that you have read, understood, 
                    and agree to be bound by these Terms and our Privacy Policy.
                  </p>
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100/50 dark:border-blue-800/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Important:</strong> Only users with valid 
                      <code className="mx-1 px-2 py-0.5 bg-white/60 rounded text-xs">@laverdad.edu.ph</code> or 
                      <code className="mx-1 px-2 py-0.5 bg-white/60 rounded text-xs">@student.laverdad.edu.ph</code> 
                      email addresses are authorized to use this service.
                    </p>
                  </div>
                </div>
             </section>

             <section id="use" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-6">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                    <Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  3. Use of Service
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You agree to use Ticket Team only for lawful purposes and in accordance with these Terms. You agree not to:
                  </p>
                  <ul className="grid gap-3 pl-2">
                    {[
                      "Use the service in any way that violates applicable laws or regulations",
                      "Impersonate or attempt to impersonate another user, person, or entity",
                      "Engage in any conduct that restricts or inhibits anyone's use of the service",
                      "Upload malicious code, viruses, or any other harmful content",
                      "Attempt to gain unauthorized access to any portion of the service",
                      "Use automated systems to access the service without our permission"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
             </section>

             <section id="conduct" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  4. User Conduct
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    You are responsible for all activity that occurs under your account. You agree to maintain 
                    professional conduct when using Ticket Team, including when creating tickets, commenting, 
                    or interacting with support staff.
                  </p>
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100/50 dark:border-amber-800/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Note:</strong> Abusive, harassing, or inappropriate 
                      behavior may result in account suspension or termination at our discretion.
                    </p>
                  </div>
                </div>
             </section>

             <section id="limitation" className="scroll-mt-28 bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  5. Limitation of Liability
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Ticket Team is provided &quot;as is&quot; without warranties of any kind. To the maximum extent 
                    permitted by law, La Verdad Christian College shall not be liable for any indirect, 
                    incidental, special, consequential, or punitive damages resulting from your use or inability 
                    to use the service.
                  </p>
                  <div className="bg-slate-50/50 dark:bg-slate-900/10 p-5 rounded-xl border border-slate-100/50 dark:border-slate-800/20 space-y-3">
                    <h3 className="font-semibold text-foreground text-sm">Changes to Terms</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We reserve the right to modify these Terms at any time. We will notify users of material 
                      changes via email or through the platform. Your continued use of Ticket Team after such 
                      modifications constitutes acceptance of the updated Terms.
                    </p>
                  </div>
                </div>
             </section>

             <section className="bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-sm">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3 mb-4">
                   <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                     <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                   </div>
                   Contact Us
                 </h2>
                <p className="text-muted-foreground mb-6">
                  If you have any questions about these Terms, please contact us:
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
