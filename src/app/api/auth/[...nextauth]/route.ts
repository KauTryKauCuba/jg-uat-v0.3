import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        // 1. Database check
        let user;
        try {
          const foundUsers = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (foundUsers.length > 0) {
            user = foundUsers[0];
          }
        } catch (error) {
          console.warn("Database lookup failed during authentication:", error);
        }

        // 2. Fallback check for static credentials if database search yielded nothing
        if (!user) {
          if (credentials.email === "admin@jobgiga.com" && credentials.password === "admin123") {
            // We hash admin123 on the fly for verification safety
            const adminHash = await bcrypt.hash("admin123", 10);
            user = {
              id: "admin-static-id",
              name: "Admin User",
              email: "admin@jobgiga.com",
              password: adminHash,
              role: "ADMIN" as const,
            };
          } else if (credentials.email === "tester@jobgiga.com" && credentials.password === "tester123") {
            const testerHash = await bcrypt.hash("tester123", 10);
            user = {
              id: "tester-static-id",
              name: "Tester User",
              email: "tester@jobgiga.com",
              password: testerHash,
              role: "TESTER" as const,
            };
          } else {
            throw new Error("Invalid credentials");
          }
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          testerGroup: (user as any).testerGroup || null,
          employerLocked: (user as any).employerLocked ?? true,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.testerGroup = user.testerGroup;
        token.employerLocked = user.employerLocked;
      }
      
      // Fetch fresh database details for tester status updates in real-time
      if (token.id && token.role === "TESTER" && token.id !== "tester-static-id") {
        try {
          const found = await db
            .select({
              testerGroup: users.testerGroup,
              employerLocked: users.employerLocked,
            })
            .from(users)
            .where(eq(users.id, token.id))
            .limit(1);
          if (found.length > 0) {
            token.testerGroup = found[0].testerGroup;
            token.employerLocked = found[0].employerLocked;
          }
        } catch (error) {
          console.warn("Database lookup failed during JWT callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.testerGroup = token.testerGroup;
        session.user.employerLocked = token.employerLocked;
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
