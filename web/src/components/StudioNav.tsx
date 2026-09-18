"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/studio/profile", label: "Profile" },
  { href: "/studio/tracks", label: "Music" },
];

export function StudioNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex gap-3 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-full px-4 py-1.5 ${
            pathname === link.href ? "bg-gold text-background" : "border border-line text-muted"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
