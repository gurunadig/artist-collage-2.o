"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/studio", label: "Home" },
  { href: "/studio/tracks", label: "Music" },
  { href: "/studio/sales", label: "Sales" },
  { href: "/studio/profile", label: "Profile" },
];

export function StudioNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex flex-wrap gap-3 text-sm">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-1.5 ${
              active ? "bg-gold text-on-gold" : "border border-line text-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
