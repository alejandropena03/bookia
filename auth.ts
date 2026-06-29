import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })
        if (!res.ok) return null
        const user = await res.json()
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenantSlug,
          businessName: user.businessName,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.tenantId = (user as { tenantId?: string }).tenantId
        token.tenantSlug = (user as { tenantSlug?: string }).tenantSlug
        token.businessName = (user as { businessName?: string }).businessName
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as { role?: string }).role = token.role as string
        ;(session.user as { tenantId?: string }).tenantId = token.tenantId as string
        ;(session.user as { tenantSlug?: string }).tenantSlug = token.tenantSlug as string
        ;(session.user as { businessName?: string }).businessName = token.businessName as string
      }
      return session
    },
  },
})
