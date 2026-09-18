"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Track } from "@/lib/types";

export default function StudioTracksPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("50");
  const [preview, setPreview] = useState("30");
  const [mp3, setMp3] = useState<File | null>(null);
  const [wav, setWav] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  function load() {
    api
      .myTracks()
      .then((data) => setTracks(data.results))
      .catch(() => undefined);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!mp3) {
      setError("Upload an MP3.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    const form = new FormData();
    form.append("title", title);
    form.append("price_inr", price);
    form.append("preview_seconds", preview);
    form.append("is_published", "true");
    form.append("mp3", mp3);
    if (wav) form.append("wav", wav);
    if (artwork) form.append("artwork", artwork);
    try {
      await api.createTrack(form);
      setTitle("");
      setMp3(null);
      setWav(null);
      setArtwork(null);
      setStatus("Published. It is on your public profile.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await api.deleteTrack(id);
    load();
  }

  if (!ready || !user) return null;

  return (
    <div>
      <h1 className="font-serif text-4xl">Music</h1>
      <p className="mt-2 text-muted">
        Upload MP3 and WAV. Fans can hear a preview. Full files stay private until purchase exists.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-line bg-panel p-6">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Title</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-muted">Price (INR)</span>
            <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="field-input" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted">Preview length (seconds)</span>
            <input
              type="number"
              min="10"
              max="90"
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              className="field-input"
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm text-muted">MP3</span>
          <input type="file" accept="audio/mpeg,.mp3" onChange={(e) => setMp3(e.target.files?.[0] || null)} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">WAV (optional)</span>
          <input type="file" accept="audio/wav,.wav" onChange={(e) => setWav(e.target.files?.[0] || null)} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">Artwork (optional)</span>
          <input type="file" accept="image/*" onChange={(e) => setArtwork(e.target.files?.[0] || null)} />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {status && <p className="text-sm text-gold">{status}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-background"
        >
          {busy ? "Uploading…" : "Publish track"}
        </button>
      </form>
      <ul className="mt-10 space-y-4">
        {tracks.map((track) => (
          <li key={track.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4">
            <div>
              <Link href={`/artist/${track.artist_slug}/${track.slug}`} className="font-serif text-xl hover:text-gold">
                {track.title}
              </Link>
              <p className="text-sm text-muted">
                ₹{track.price_inr.toLocaleString("en-IN")} · {track.preview_seconds}s preview
                {track.is_published ? "" : " · hidden"}
              </p>
            </div>
            <button type="button" onClick={() => remove(track.id)} className="text-sm text-muted hover:text-foreground">
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
