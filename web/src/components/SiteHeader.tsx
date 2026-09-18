"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, logout, ready } = useAuth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <Link href="/" className="font-serif text-xl tracking-tight">
          Artist Collage
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/artists" className="hover:text-foreground">
            Directory
          </Link>
          {ready && user ? (
            <>
              <Link href="/studio/profile" className="hover:text-foreground">
                Studio
              </Link>
              <button type="button" onClick={logout} className="hover:text-foreground">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-gold px-4 py-1.5 text-gold hover:bg-gold hover:text-background"
              >
                Create profile
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
