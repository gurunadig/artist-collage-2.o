"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PreviewPlayer } from "@/components/PreviewPlayer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Track } from "@/lib/types";

type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void };

export function BuyPanel({
  artistSlug,
  trackSlug,
  initial,
}: {
  artistSlug: string;
  trackSlug: string;
  initial: Track;
}) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const [track, setTrack] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .track(artistSlug, trackSlug)
      .then(setTrack)
      .catch(() => undefined);
  }, [artistSlug, trackSlug, user]);

  async function payWithRazorpay() {
    setBusy(true);
    setError("");
    try {
      const order = await api.createOrder(artistSlug, trackSlug);
      if (order.mock) {
        await api.verifyOrder(order.id, { razorpay_order_id: order.razorpay_order_id });
        setTrack(await api.track(artistSlug, trackSlug));
        return;
      }
      await loadRazorpay();
      const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
      const checkout = new Razorpay({
        key: order.key_id,
        amount: order.amount_paise,
        currency: "INR",
        name: "Artist Collage",
        description: order.track_title,
        order_id: order.razorpay_order_id,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await api.verifyOrder(order.id, response);
          setTrack(await api.track(artistSlug, trackSlug));
        },
      });
      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed.");
    } finally {
      setBusy(false);
    }
  }

  if (track.owned) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gold">You own this track.</p>
        <PreviewPlayer src={track.stream_url || null} previewSeconds={0} />
        <div className="flex flex-wrap gap-4 text-sm">
          {track.download_mp3_url && (
            <a href={track.download_mp3_url} className="text-gold hover:underline">
              Download MP3
            </a>
          )}
          {track.download_wav_url && (
            <a href={track.download_wav_url} className="text-gold hover:underline">
              Download WAV
            </a>
          )}
          <Link href="/library" className="text-muted hover:text-foreground">
            Library
          </Link>
        </div>
      </div>
    );
  }

  const loginHref = `/login?next=${encodeURIComponent(pathname || "/")}`;

  return (
    <div className="space-y-4">
      <PreviewPlayer
        src={track.preview_url}
        previewSeconds={track.preview_seconds}
        previewStart={track.has_preview_audio ? 0 : track.preview_start_seconds || 0}
      />
      <p className="text-sm text-muted">
        A {track.preview_seconds}-second preview. Buy to download MP3
        {track.has_wav ? " and WAV" : ""} and keep the file.
      </p>
      {ready && user ? (
        <button
          type="button"
          disabled={busy}
          onClick={payWithRazorpay}
          className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-on-gold"
        >
          {busy ? "Working…" : `Buy · ₹${track.price_inr.toLocaleString("en-IN")}`}
        </button>
      ) : (
        <Link href={loginHref} className="inline-block rounded-full bg-gold px-6 py-3 text-sm font-medium text-on-gold">
          Sign in to buy
        </Link>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function loadRazorpay() {
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay."));
    document.body.appendChild(script);
  });
}
