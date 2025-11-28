import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
import { createClient } from "@/lib/supabase/server"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "Ticket Team - La Verdad Christian College",
  description: "Intelligent Helpdesk Platform for La Verdad Christian College",
  icons: {
    icon: "/logo.svg"
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load user preferences server-side for initial render
  let initialPreferences = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      initialPreferences = data
    }
  } catch (error) {
    // Silently fail - preferences will load client-side
    console.error('Failed to load initial preferences:', error)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <Analytics />
      <SpeedInsights />
      <body
        className={`${poppins.variable} font-[family-name:var(--font-poppins)] antialiased`}
        suppressHydrationWarning
      >
        <Providers initialPreferences={initialPreferences}>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
