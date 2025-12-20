import { redirect } from 'next/navigation'

export default function AdminPage() {
  // Redirect to User Management as the default admin page
  redirect('/admin/users')
}
