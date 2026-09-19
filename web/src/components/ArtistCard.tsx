import Link from "next/link";
import type { Artist } from "@/lib/types";

export function formatRate(value: number | null) {
  if (value == null) return null;
  return `₹${value.toLocaleString("en-IN")}+`;
}

export function ArtistCard({ artist }: { artist: Artist }) {
  const rate = formatRate(artist.starting_rate_inr);
  return (
    <Link
      href={`/artist/${artist.slug}`}
      className="group overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-gold/40"
    >
      <div className="aspect-[4/3] bg-well">
        {artist.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artist.image_url} alt={artist.stage_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-4 font-serif text-4xl text-gold/40">
            {artist.stage_name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl leading-tight group-hover:text-gold">{artist.stage_name}</h2>
            <p className="text-sm text-muted">
              {[artist.discipline?.name, artist.city].filter(Boolean).join(" · ")}
            </p>
          </div>
          {artist.verification_status === "verified" && (
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gold">
              Verified
            </span>
          )}
        </div>
        <p className="text-sm text-muted">
          {artist.languages.map((item) => item.name).join(", ")}
        </p>
        {rate && <p className="text-sm">{rate}</p>}
      </div>
    </Link>
  );
}
