import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/shared/navbar"
import { Footer } from "@/components/shared/footer"
import { PrivacyContent } from "./privacy-content"
import type { User } from "@/lib/types/users"

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let user: User | null = null

  if (authUser) {
    // Use maybeSingle() to avoid 406 for first-time users (profile may not exist yet)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
      
    if (data) {
      user = data as User
    }
  }

  return (
    <main className="relative min-h-screen font-[family-name:var(--font-poppins)] bg-gradient-to-br from-[#d4e8f0] via-[#e8f4f8] to-[#0a4d7e]">
       {/* Pass user to Navbar for server-side auth state handling */}
      <Navbar user={user} transparent />
      <PrivacyContent />
      <Footer />
    </main>
  )
}
