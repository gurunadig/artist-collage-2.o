"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatClock, previewWindowLength } from "@/lib/previewAudio";
import type { Artist, Track } from "@/lib/types";

export default function StudioHomePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [profile, setProfile] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [saleCount, setSaleCount] = useState(0);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/studio");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    api.getMyProfile().then(setProfile).catch(() => setProfile(null));
    api.myTracks().then((data) => setTracks(data.results)).catch(() => undefined);
    api
      .sales()
      .then((data) => {
        setEarnings(data.total_earnings_inr);
        setSaleCount(data.count);
      })
      .catch(() => undefined);
  }, [user]);

  if (!ready || !user) return null;

  const published = tracks.filter((track) => track.is_published);
  const latest = tracks[0];
  const needsPreview = tracks.find((track) => track.has_mp3 && !track.has_preview_audio);
  const next = !profile?.stage_name
    ? { href: "/studio/profile", label: "Create your profile", copy: "Your public page needs a stage name before anyone can find you." }
    : tracks.length === 0
      ? { href: "/studio/tracks", label: "Upload a track", copy: "Put a song on your page. Fans can preview 30 seconds, then buy." }
      : needsPreview
        ? { href: "/studio/tracks", label: "Place the preview window", copy: `${needsPreview.title} still uses the start of the file. Drag the gold window onto the hook.` }
        : profile.slug
          ? { href: `/artist/${profile.slug}`, label: "Share your page", copy: "Profile and music are live. Send the link to fans and collaborators." }
          : { href: "/studio/profile", label: "Finish your profile", copy: "Add a public URL so people can open your page." };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-gold">Studio</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Good light. Good work.</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Your storefront at a glance — then go upload, place a preview, or get paid.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <article className="relative overflow-hidden rounded-3xl border border-line bg-panel sm:col-span-2 lg:row-span-2">
          <div className="aspect-[16/9] bg-well sm:aspect-auto sm:h-48 lg:h-56">
            {profile?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-end p-6 font-serif text-6xl text-gold/40">
                {(profile?.stage_name || "A").slice(0, 1)}
              </div>
            )}
          </div>
          <div className="space-y-3 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-3xl">{profile?.stage_name || "Your artist name"}</h2>
                <p className="mt-1 text-sm text-muted">
                  {[profile?.discipline?.name, profile?.city].filter(Boolean).join(" · ") || "Add city and discipline"}
                </p>
              </div>
              {profile?.verification_status === "verified" && (
                <span className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-wide text-gold">
                  Verified
                </span>
              )}
            </div>
            {profile?.slug ? (
              <Link href={`/artist/${profile.slug}`} className="inline-block text-sm text-gold hover:underline">
                View public page
              </Link>
            ) : (
              <Link href="/studio/profile" className="inline-block text-sm text-gold hover:underline">
                Set up profile
              </Link>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-wide text-muted">Earnings</p>
          <p className="mt-3 font-serif text-4xl text-money">₹{earnings.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-sm text-muted">
            {saleCount ? `${saleCount} sale${saleCount === 1 ? "" : "s"} after platform fee` : "No sales yet"}
          </p>
          <Link href="/studio/sales" className="mt-4 inline-block text-sm text-gold hover:underline">
            Sales
          </Link>
        </article>

        <article className="rounded-3xl border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-wide text-muted">Music</p>
          <p className="mt-3 font-serif text-4xl">{tracks.length}</p>
          <p className="mt-2 text-sm text-muted">
            {published.length} live
            {latest ? ` · latest ${latest.title}` : ""}
          </p>
          <Link href="/studio/tracks" className="mt-4 inline-block text-sm text-gold hover:underline">
            {tracks.length ? "Manage tracks" : "Upload a track"}
          </Link>
        </article>

        <article className="rounded-3xl border border-gold/50 bg-panel p-6 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-gold">Next</p>
          <h2 className="mt-3 font-serif text-2xl">{next.label}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{next.copy}</p>
          <Link
            href={next.href}
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold"
          >
            {next.label}
          </Link>
        </article>

        <PreviewTile tracks={tracks} />
      </div>
    </div>
  );
}

function PreviewTile({ tracks }: { tracks: Track[] }) {
  const live = tracks.find((track) => track.is_published) || tracks[0];
  if (!live) {
    return (
      <article className="rounded-3xl border border-line bg-panel p-6 sm:col-span-2">
        <p className="text-xs uppercase tracking-wide text-muted">Preview</p>
        <p className="mt-3 font-serif text-2xl">No window yet</p>
        <p className="mt-2 text-sm text-muted">After you upload, drag a 30-second slice onto the hook.</p>
      </article>
    );
  }
  const start = live.preview_start_seconds || 0;
  const length = previewWindowLength(live.duration_seconds || live.preview_seconds || 30);
  return (
    <article className="rounded-3xl border border-line bg-panel p-6 sm:col-span-2">
      <p className="text-xs uppercase tracking-wide text-muted">Preview</p>
      <p className="mt-3 font-serif text-2xl">{live.title}</p>
      <p className="mt-2 text-sm text-muted">
        {formatClock(start)} – {formatClock(start + length)}
        {live.has_preview_audio ? " · clip saved" : " · save the window so fans hear this slice"}
      </p>
      <Link href="/studio/tracks" className="mt-4 inline-block text-sm text-gold hover:underline">
        Edit window
      </Link>
    </article>
  );
}
