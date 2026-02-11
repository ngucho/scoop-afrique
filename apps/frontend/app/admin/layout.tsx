/**
 * Admin shell. Auth and sidebar are in (protected)/layout so /admin/login stays public.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>
}
