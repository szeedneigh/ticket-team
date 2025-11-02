import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-white/20 bg-white/10 backdrop-blur-md mt-auto">
      <div className="container mx-auto py-8 px-4">
        {/* Wrapper to center the grid content */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 w-full max-w-4xl">
            
            {/* Brand Info */}
            <section aria-labelledby="footer-brand">
              <h3 id="footer-brand" className="mb-4 text-lg font-semibold text-white">
                TicketTeam
              </h3>
              <p className="text-sm text-white/80">
                Intelligent helpdesk platform for La Verdad Christian College.
                Streamline support with AI-powered ticketing and knowledge management.
              </p>
            </section>
            
            {/* Quick Links */}
            <nav aria-labelledby="footer-quick-links">
              <h4 id="footer-quick-links" className="mb-4 text-sm font-semibold text-white">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link 
                    href="/kb" 
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Knowledge Base
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/help" 
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Contact Support
                  </Link>
                </li>
              </ul>
            </nav>
            
            {/* Legal Links */}
            <nav aria-labelledby="footer-legal">
              <h4 id="footer-legal" className="mb-4 text-sm font-semibold text-white">
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link 
                    href="/privacy" 
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms" 
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>

          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 border-t border-white/20 pt-8 text-center text-sm text-white/70">
          <p>© {currentYear} TicketTeam - La Verdad Christian College. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}