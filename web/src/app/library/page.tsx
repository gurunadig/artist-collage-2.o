"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PreviewPlayer } from "@/components/PreviewPlayer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Track } from "@/lib/types";

export default function LibraryPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/library");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .library()
      .then((data) => setTracks(data.results))
      .catch(() => undefined);
  }, [user]);

  if (!ready || !user) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-4xl">Library</h1>
      <p className="mt-2 text-muted">Tracks you bought. You own the files.</p>
      {tracks.length === 0 && <p className="mt-8 text-muted">Nothing here yet. Buy a track from an artist page.</p>}
      <ul className="mt-8 space-y-8">
        {tracks.map((track) => (
          <li key={track.id} className="rounded-2xl border border-line bg-panel p-6">
            <Link href={`/artist/${track.artist_slug}/${track.slug}`} className="font-serif text-2xl hover:text-gold">
              {track.title}
            </Link>
            <p className="mt-1 text-sm text-muted">{track.artist_name}</p>
            <div className="mt-4">
              <PreviewPlayer src={track.stream_url || null} previewSeconds={0} />
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              {track.download_mp3_url && (
                <a href={track.download_mp3_url} className="text-gold hover:underline">
                  MP3
                </a>
              )}
              {track.download_wav_url && (
                <a href={track.download_wav_url} className="text-gold hover:underline">
                  WAV
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
