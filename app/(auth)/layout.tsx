export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg app-text-hi min-h-screen">
      {children}
    </div>
  )
}
