"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  clampPreviewStart,
  decodeAudioSource,
  formatClock,
  peaksFromBuffer,
  previewWindowLength,
  PREVIEW_WINDOW_SECONDS,
} from "@/lib/previewAudio";

export function PreviewWindowPicker({
  source,
  startSeconds,
  onChange,
}: {
  source: File | string | null;
  startSeconds: number;
  onChange: (start: number, duration: number, buffer: AudioBuffer | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<number | null>(null);
  const startRef = useRef(startSeconds);
  const windowLenRef = useRef(PREVIEW_WINDOW_SECONDS);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef(0);
  const playingRef = useRef(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);

  const windowLen = previewWindowLength(duration);
  startRef.current = startSeconds;
  windowLenRef.current = windowLen;

  function stopPlayback(resetHead = false) {
    const node = sourceNodeRef.current;
    sourceNodeRef.current = null;
    playingRef.current = false;
    setPlaying(false);
    if (node) {
      node.onended = null;
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
      node.disconnect();
    }
    if (resetHead) setPlayhead(startRef.current);
  }

  function startPlayback() {
    const buffer = bufferRef.current;
    if (!buffer) return;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();
    stopPlayback();
    const start = startRef.current;
    const length = windowLenRef.current;
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(ctx.destination);
    node.start(0, start, length);
    node.onended = () => {
      if (sourceNodeRef.current !== node) return;
      sourceNodeRef.current = null;
      playingRef.current = false;
      setPlaying(false);
      setPlayhead(startRef.current);
    };
    sourceNodeRef.current = node;
    startedAtRef.current = ctx.currentTime;
    playingRef.current = true;
    setPlaying(true);
    setPlayhead(start);
  }

  useEffect(() => {
    if (!source) {
      bufferRef.current = null;
      setPeaks([]);
      setDuration(0);
      onChange(0, 0, null);
      return;
    }
    let cancelled = false;
    setError("");
    decodeAudioSource(source)
      .then((buffer) => {
        if (cancelled) return;
        bufferRef.current = buffer;
        const nextDuration = buffer.duration;
        const nextStart = clampPreviewStart(startSeconds, nextDuration);
        setDuration(nextDuration);
        setPeaks(peaksFromBuffer(buffer));
        onChange(nextStart, nextDuration, buffer);
      })
      .catch(() => {
        if (!cancelled) setError("Could not read this audio file.");
      });
    return () => {
      cancelled = true;
    };
    // Decode when the source file/url changes, not on every drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    stopPlayback(true);
    setPlayhead(null);
  }, [source]);

  useEffect(() => {
    setPlayhead(startSeconds);
    if (playingRef.current) stopPlayback();
  }, [startSeconds]);

  useEffect(() => {
    if (!playing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    let raf = 0;
    const tick = () => {
      if (!playingRef.current) return;
      const elapsed = ctx.currentTime - startedAtRef.current;
      const start = startRef.current;
      const length = windowLenRef.current;
      if (elapsed >= length) {
        setPlayhead(start);
        return;
      }
      setPlayhead(start + elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    return () => {
      stopPlayback();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks.length) return;
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 96;
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, width, height);
    const barWidth = width / peaks.length;
    peaks.forEach((peak, index) => {
      const barHeight = Math.max(2, peak * (height - 8));
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      ctx.fillStyle = "rgba(196, 165, 116, 0.35)";
      ctx.fillRect(x + 0.5, y, Math.max(1, barWidth - 1), barHeight);
    });
  }, [peaks]);

  function toggle() {
    if (playingRef.current) {
      stopPlayback();
      return;
    }
    startPlayback();
  }

  if (!source) {
    return <p className="text-sm text-muted">Choose an MP3 to place the 30-second preview.</p>;
  }
  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }
  const locked = duration <= PREVIEW_WINDOW_SECONDS;
  const leftPct = duration ? (startSeconds / duration) * 100 : 0;
  const widthPct = duration ? (windowLen / duration) * 100 : 100;
  const head = playhead ?? startSeconds;
  const playheadPct = duration ? (head / duration) * 100 : null;

  function clientToStart(clientX: number) {
    const track = trackRef.current;
    if (!track || !duration) return startSeconds;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return clampPreviewStart(ratio * duration - windowLen / 2, duration);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (locked) return;
    if (playingRef.current) stopPlayback();
    event.currentTarget.setPointerCapture(event.pointerId);
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const selLeft = (leftPct / 100) * rect.width;
    const selRight = selLeft + (widthPct / 100) * rect.width;
    if (x >= selLeft && x <= selRight) {
      dragOffset.current = x - selLeft;
    } else {
      dragOffset.current = (widthPct / 100) * rect.width / 2;
      onChange(clientToStart(event.clientX), duration, null);
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragOffset.current == null || locked) return;
    const track = trackRef.current;
    if (!track || !duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = (event.clientX - rect.left - dragOffset.current) / rect.width;
    onChange(clampPreviewStart(ratio * duration, duration), duration, null);
  }

  function onPointerUp() {
    dragOffset.current = null;
  }

  return (
    <div className="space-y-3">
      {!duration ? (
        <p className="text-sm text-muted">Reading waveform…</p>
      ) : (
        <>
          <div
            ref={trackRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative h-24 cursor-ew-resize overflow-hidden rounded-xl border border-line bg-well select-none"
          >
            <canvas ref={canvasRef} className="h-full w-full" />
            <div
              className="pointer-events-none absolute top-0 h-full rounded-md border border-gold bg-gold/15"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
            {playheadPct != null && (
              <div
                className="pointer-events-none absolute top-0 z-10 h-full w-0.5 bg-foreground"
                style={{ left: `${playheadPct}%` }}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={toggle}
              className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold"
            >
              {playing ? "Pause" : "Play preview"}
            </button>
            <p className="text-sm text-muted">
              {locked
                ? `Track is ${formatClock(duration)}. The whole file is the preview.`
                : `Preview ${formatClock(startSeconds)} – ${formatClock(startSeconds + windowLen)} · drag the gold window`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
