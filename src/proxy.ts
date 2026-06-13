import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || "default_secret_for_uat_phase1_super_secret" 
  });
  const { pathname } = req.nextUrl;

  // If user is authenticated
  if (token) {
    // Redirect logged in user from root "/" to their respective dashboard
    if (pathname === "/") {
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else if (token.role === "TESTER") {
        return NextResponse.redirect(new URL("/tester", req.url));
      }
    }

    // Guard "/admin/*" - Only ADMINs allowed
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Guard "/tester/*" - Only TESTERs allowed
    if (pathname.startsWith("/tester") && token.role !== "TESTER") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else {
    // If NOT authenticated, block access to dashboards and redirect to login page "/"
    if (pathname.startsWith("/admin") || pathname.startsWith("/tester")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/tester/:path*"],
};
