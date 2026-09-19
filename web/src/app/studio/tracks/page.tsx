"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PreviewWindowPicker } from "@/components/PreviewWindowPicker";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  encodePreviewWav,
  formatClock,
  previewWindowLength,
} from "@/lib/previewAudio";
import type { Track } from "@/lib/types";

export default function StudioTracksPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("50");
  const [mp3, setMp3] = useState<File | null>(null);
  const [wav, setWav] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [previewStart, setPreviewStart] = useState(0);
  const [duration, setDuration] = useState(0);
  const bufferRef = useRef<AudioBuffer | null>(null);
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
    form.append("preview_start_seconds", String(previewStart));
    form.append("is_published", "true");
    form.append("mp3", mp3);
    if (duration) form.append("duration_seconds", String(duration));
    if (wav) form.append("wav", wav);
    if (artwork) form.append("artwork", artwork);
    if (bufferRef.current && duration) {
      const clip = encodePreviewWav(bufferRef.current, previewStart, previewWindowLength(duration));
      form.append("preview_audio", clip, "preview.wav");
    }
    try {
      await api.createTrack(form);
      setTitle("");
      setMp3(null);
      setWav(null);
      setArtwork(null);
      setPreviewStart(0);
      setDuration(0);
      bufferRef.current = null;
      setStatus("Published. It is on your public profile.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError("");
    setStatus("");
    try {
      await api.deleteTrack(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove.");
      load();
    }
  }

  if (!ready || !user) return null;

  return (
    <div>
      <h1 className="font-serif text-4xl">Music</h1>
      <p className="mt-2 text-muted">
        Upload MP3 and WAV. Drag a 30-second window on the waveform for the public preview. Full files
        stay private until someone buys.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-line bg-panel p-6">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Title</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">Price (INR)</span>
          <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="field-input" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">MP3</span>
          <input
            type="file"
            accept="audio/mpeg,.mp3"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setMp3(file);
              setPreviewStart(0);
              bufferRef.current = null;
            }}
          />
        </label>
        <PreviewWindowPicker
          source={mp3}
          startSeconds={previewStart}
          onChange={(start, nextDuration, buffer) => {
            setPreviewStart(start);
            setDuration(nextDuration);
            if (buffer) bufferRef.current = buffer;
            if (!buffer && !nextDuration) bufferRef.current = null;
          }}
        />
        <label className="block space-y-2">
          <span className="text-sm text-muted">WAV (optional)</span>
          <input type="file" accept="audio/wav,.wav" onChange={(e) => setWav(e.target.files?.[0] || null)} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-muted">Artwork (optional)</span>
          <input type="file" accept="image/*" onChange={(e) => setArtwork(e.target.files?.[0] || null)} />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        {status && <p className="text-sm text-gold">{status}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-on-gold"
        >
          {busy ? "Uploading…" : "Publish track"}
        </button>
      </form>
      {error && <p className="mt-6 text-sm text-danger">{error}</p>}
      <ul className="mt-10 space-y-4">
        {tracks.map((track) => (
          <ExistingTrackCard key={track.id} track={track} onChanged={load} onRemove={() => remove(track.id)} />
        ))}
      </ul>
    </div>
  );
}

function ExistingTrackCard({
  track,
  onChanged,
  onRemove,
}: {
  track: Track;
  onChanged: () => void;
  onRemove: () => void;
}) {
  const bufferRef = useRef<AudioBuffer | null>(null);
  const [start, setStart] = useState(track.preview_start_seconds || 0);
  const [duration, setDuration] = useState(track.duration_seconds || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const windowLen = previewWindowLength(duration || track.preview_seconds || 30);

  useEffect(() => {
    setStart(track.preview_start_seconds || 0);
    if (track.duration_seconds) setDuration(track.duration_seconds);
  }, [track.preview_start_seconds, track.duration_seconds]);

  async function saveWindow() {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("preview_start_seconds", String(start));
    if (duration) form.append("duration_seconds", String(duration));
    if (bufferRef.current && duration) {
      const clip = encodePreviewWav(bufferRef.current, start, previewWindowLength(duration));
      form.append("preview_audio", clip, "preview.wav");
    }
    try {
      await api.updateTrack(track.id, form);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preview.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-4 rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/artist/${track.artist_slug}/${track.slug}`} className="font-serif text-xl hover:text-gold">
            {track.title}
          </Link>
          <p className="text-sm text-muted">
            ₹{track.price_inr.toLocaleString("en-IN")} · preview {formatClock(start)}–
            {formatClock(start + windowLen)}
            {track.is_published ? "" : " · hidden"}
          </p>
        </div>
        <button type="button" onClick={onRemove} className="text-sm text-muted hover:text-foreground">
          Remove
        </button>
      </div>
      {track.stream_url ? (
        <PreviewWindowPicker
          source={track.stream_url}
          startSeconds={start}
          onChange={(nextStart, nextDuration, buffer) => {
            setStart(nextStart);
            if (nextDuration) setDuration(nextDuration);
            if (buffer) bufferRef.current = buffer;
          }}
        />
      ) : (
        <p className="text-sm text-muted">Sign in as this artist to move the preview window.</p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={saveWindow}
        className="rounded-full border border-gold px-4 py-2 text-sm text-gold"
      >
        {busy ? "Saving…" : "Save preview window"}
      </button>
    </li>
  );
}
