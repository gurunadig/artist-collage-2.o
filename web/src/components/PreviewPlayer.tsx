"use client";

import { useEffect, useRef, useState } from "react";

export function PreviewPlayer({
  src,
  previewSeconds,
  previewStart = 0,
}: {
  src: string | null;
  previewSeconds: number;
  previewStart?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const start = previewSeconds > 0 ? previewStart : 0;
  const end = previewSeconds > 0 ? previewStart + previewSeconds : Number.POSITIVE_INFINITY;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    setSeconds(0);
  }, [src, previewStart, previewSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (previewSeconds > 0 && audio.currentTime < start) {
        audio.currentTime = start;
        return;
      }
      if (previewSeconds > 0 && audio.currentTime >= end) {
        audio.pause();
        audio.currentTime = start;
        setPlaying(false);
        setSeconds(0);
        return;
      }
      setSeconds(Math.max(0, audio.currentTime - start));
    };
    const onEnded = () => {
      setPlaying(false);
      setSeconds(0);
      if (previewSeconds > 0) audio.currentTime = start;
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [previewSeconds, start, end]);

  if (!src) {
    return <p className="text-sm text-muted">Preview is not available yet.</p>;
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    const seekAndPlay = () => {
      if (previewSeconds > 0) audio.currentTime = start;
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };
    if (audio.readyState >= 1) seekAndPlay();
    else audio.addEventListener("loadedmetadata", seekAndPlay, { once: true });
  }

  return (
    <div className="flex items-center gap-4">
      <audio ref={audioRef} src={src} preload="none" />
      <button
        type="button"
        onClick={toggle}
        className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold"
      >
        {playing ? "Pause" : previewSeconds > 0 ? "Play preview" : "Play"}
      </button>
      <p className="text-sm text-muted">
        {previewSeconds > 0
          ? `${Math.floor(seconds)}s / ${previewSeconds}s preview`
          : `${Math.floor(seconds)}s`}
      </p>
    </div>
  );
}
