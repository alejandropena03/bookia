import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { readFileSync } from "fs"
import path from "path"

function getUsers() {
  const filePath = path.join(process.cwd(), "data", "users.json")
  return JSON.parse(readFileSync(filePath, "utf-8"))
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const users = getUsers()
        const user = users.find(
          (u: { email: string; password: string }) =>
            u.email === credentials.email && u.password === credentials.password
        )
        if (!user) return null
        return {
          id: user.id,
          email: user.email,
          name: user.businessName,
          businessName: user.businessName,
          businessType: user.businessType,
          city: user.city,
          plan: user.plan,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.businessName = (user as { businessName?: string }).businessName
        token.plan = (user as { plan?: string }).plan
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { businessName?: string; plan?: string }).businessName = token.businessName as string
        ;(session.user as { businessName?: string; plan?: string }).plan = token.plan as string
      }
      return session
    },
  },
})
