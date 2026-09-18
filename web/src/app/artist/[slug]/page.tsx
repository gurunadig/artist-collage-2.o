import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatRate } from "@/components/ArtistCard";
import { api } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const artist = await api.artist(slug);
    const title = artist.stage_name;
    const description =
      artist.bio ||
      `${artist.stage_name} — ${[artist.discipline?.name, artist.city].filter(Boolean).join(" in ")}`;
    return {
      title,
      description,
      openGraph: {
        title: `${title} · Artist Collage`,
        description,
        url: `/artist/${artist.slug}`,
      },
    };
  } catch {
    return { title: "Artist" };
  }
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  let artist;
  try {
    artist = await api.artist(slug);
  } catch {
    notFound();
  }

  const rate = formatRate(artist.starting_rate_inr);
  const socials = Object.entries(artist.social_links || {}).filter(([, value]) => value);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="aspect-[16/7] bg-[#1e1b18]">
          {artist.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artist.image_url} alt={artist.stage_name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="space-y-6 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gold">
                {artist.discipline?.name}
                {artist.city ? ` · ${artist.city}` : ""}
              </p>
              <h1 className="mt-2 font-serif text-5xl">{artist.stage_name}</h1>
            </div>
            {artist.verification_status === "verified" && (
              <span className="rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-wide text-gold">
                Verified
              </span>
            )}
          </div>
          {artist.bio && <p className="max-w-2xl text-lg leading-8 text-muted">{artist.bio}</p>}
          <dl className="grid gap-6 sm:grid-cols-2">
            <Info label="Languages" value={artist.languages.map((item) => item.name).join(", ")} />
            <Info label="Genres" value={artist.genres.map((item) => item.name).join(", ")} />
            <Info label="Skills" value={(artist.skills || []).join(", ")} />
            <Info
              label="Availability"
              value={[
                artist.available_for_hire ? "Hiring" : null,
                artist.available_for_collaboration ? "Collaboration" : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Not listed"}
            />
            {rate && <Info label="Starting rate" value={rate} />}
          </dl>
          {!!artist.tracks?.length && (
            <div>
              <h2 className="font-serif text-2xl">Music</h2>
              <ul className="mt-4 space-y-3">
                {artist.tracks.map((track) => (
                  <li key={track.id}>
                    <Link
                      href={`/artist/${artist.slug}/${track.slug}`}
                      className="flex items-center justify-between rounded-2xl border border-line px-4 py-3 hover:border-gold/40"
                    >
                      <span className="font-serif text-xl">{track.title}</span>
                      <span className="text-sm text-muted">
                        ₹{track.price_inr.toLocaleString("en-IN")}+ · {track.preview_seconds}s preview
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!artist.portfolio_items?.length && (
            <div>
              <h2 className="font-serif text-2xl">Portfolio</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {artist.portfolio_items.map((item) => (
                  <li key={item.id || item.title}>
                    {item.url ? (
                      <a href={item.url} className="text-gold hover:underline">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                    {item.description ? ` — ${item.description}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm">
              {socials.map(([key, value]) => (
                <a key={key} href={value} className="capitalize text-gold hover:underline">
                  {key}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
