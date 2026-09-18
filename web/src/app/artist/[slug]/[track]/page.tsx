import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PreviewPlayer } from "@/components/PreviewPlayer";
import { api } from "@/lib/api";

type Props = { params: Promise<{ slug: string; track: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, track } = await params;
  try {
    const item = await api.track(slug, track);
    return {
      title: `${item.title} — ${item.artist_name}`,
      description: `Preview ${item.title} by ${item.artist_name}. Buy and own the file — store coming next.`,
      openGraph: {
        title: `${item.title} · Artist Collage`,
        description: `₹${item.price_inr}+ from ${item.artist_name}`,
        url: `/artist/${item.artist_slug}/${item.slug}`,
      },
    };
  } catch {
    return { title: "Track" };
  }
}

export default async function TrackPage({ params }: Props) {
  const { slug, track } = await params;
  let item;
  try {
    item = await api.track(slug, track);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">
        <Link href={`/artist/${item.artist_slug}`} className="hover:underline">
          {item.artist_name}
        </Link>
      </p>
      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="aspect-square max-h-80 bg-[#1e1b18] sm:aspect-[16/8]">
          {item.artwork_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.artwork_url} alt={item.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="space-y-6 p-8">
          <h1 className="font-serif text-5xl">{item.title}</h1>
          <p className="text-lg text-muted">
            ₹{item.price_inr.toLocaleString("en-IN")}+ · MP3{item.has_wav ? " + WAV" : ""}
          </p>
          <PreviewPlayer src={item.preview_url} previewSeconds={item.preview_seconds} />
          <p className="text-sm text-muted">
            Preview is limited to {item.preview_seconds} seconds. Full download after purchase will
            land in the next slice — buy, own the file, support the artist.
          </p>
        </div>
      </div>
    </div>
  );
}
