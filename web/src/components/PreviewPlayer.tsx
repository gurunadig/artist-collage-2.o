"use client";

import { useEffect, useRef, useState } from "react";

export function PreviewPlayer({
  src,
  previewSeconds,
}: {
  src: string | null;
  previewSeconds: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.currentTime >= previewSeconds) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
        setSeconds(0);
        return;
      }
      setSeconds(audio.currentTime);
    };
    const onEnded = () => {
      setPlaying(false);
      setSeconds(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [previewSeconds]);

  if (!src) {
    return <p className="text-sm text-muted">Preview is not available yet.</p>;
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <audio ref={audioRef} src={src} preload="none" />
      <button
        type="button"
        onClick={toggle}
        className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-background"
      >
        {playing ? "Pause" : "Play preview"}
      </button>
      <p className="text-sm text-muted">
        {Math.floor(seconds)}s / {previewSeconds}s preview
      </p>
    </div>
  );
}
