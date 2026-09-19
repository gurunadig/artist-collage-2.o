export const PREVIEW_WINDOW_SECONDS = 30;

export function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds + 0.0001));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function previewWindowLength(duration: number) {
  if (!duration || duration <= 0) return PREVIEW_WINDOW_SECONDS;
  return Math.min(PREVIEW_WINDOW_SECONDS, duration);
}

export function clampPreviewStart(start: number, duration: number) {
  const windowLen = previewWindowLength(duration);
  const maxStart = Math.max(0, duration - windowLen);
  return Math.min(Math.max(0, start), maxStart);
}

export function peaksFromBuffer(buffer: AudioBuffer, bars = 240) {
  const channel = buffer.getChannelData(0);
  const size = Math.max(1, Math.floor(channel.length / bars));
  const peaks: number[] = [];
  for (let i = 0; i < bars; i += 1) {
    let max = 0;
    const offset = i * size;
    for (let j = 0; j < size; j += 1) {
      const value = Math.abs(channel[offset + j] || 0);
      if (value > max) max = value;
    }
    peaks.push(max);
  }
  return peaks;
}

export async function decodeAudioSource(source: File | string) {
  const ctx = new AudioContext();
  try {
    const data =
      typeof source === "string" ? await (await fetch(source)).arrayBuffer() : await source.arrayBuffer();
    return await ctx.decodeAudioData(data.slice(0));
  } finally {
    await ctx.close();
  }
}

export function encodePreviewWav(buffer: AudioBuffer, startSeconds: number, lengthSeconds: number) {
  const outRate = 22050;
  const start = Math.floor(startSeconds * buffer.sampleRate);
  const rawLength = Math.floor(lengthSeconds * buffer.sampleRate);
  const end = Math.min(buffer.length, Math.max(start + 1, start + rawLength));
  const ratio = buffer.sampleRate / outRate;
  const outLength = Math.max(1, Math.floor((end - start) / ratio));
  const samples = new Int16Array(outLength);
  const channels = buffer.numberOfChannels;
  for (let i = 0; i < outLength; i += 1) {
    const srcIndex = Math.min(buffer.length - 1, start + Math.floor(i * ratio));
    let sum = 0;
    for (let c = 0; c < channels; c += 1) {
      sum += buffer.getChannelData(c)[srcIndex] || 0;
    }
    const mixed = Math.max(-1, Math.min(1, sum / channels));
    samples[i] = mixed < 0 ? mixed * 0x8000 : mixed * 0x7fff;
  }

  const bytes = samples.length * 2;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, outRate, true);
  view.setUint32(28, outRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, bytes, true);
  return new Blob([header, samples], { type: "audio/wav" });
}
