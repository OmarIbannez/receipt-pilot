"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";

  return (
    <nav className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-stone-900 tracking-tight">
          ReceiptPilot
        </Link>

        {/* Nav links + auth */}
        <div className="flex items-center gap-4">
          {isSignedIn && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Dashboard
            </Link>
          )}

          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-3">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  className="h-8 w-8 rounded-full border border-stone-200"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600">
                  {session.user?.name?.charAt(0) ?? "U"}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => signIn("google")}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
