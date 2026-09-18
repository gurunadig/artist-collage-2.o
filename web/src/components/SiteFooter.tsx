import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Artist Collage — a professional home, not a social network.</p>
        <Link href="/artists" className="hover:text-foreground">
          Browse artists
        </Link>
      </div>
    </footer>
  );
}
