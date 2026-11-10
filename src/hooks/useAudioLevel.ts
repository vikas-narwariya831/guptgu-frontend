import { useState, useEffect } from 'react';

// Single shared AudioContext across all tiles (prevents hitting browser AudioContext limits & saves RAM)
let sharedAudioCtx: AudioContext | null = null;
let activeListeners = 0;

function acquireAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    activeListeners++;
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function releaseAudioContext() {
  activeListeners = Math.max(0, activeListeners - 1);
  if (activeListeners === 0 && sharedAudioCtx && sharedAudioCtx.state !== 'closed') {
    const ctxToClose = sharedAudioCtx;
    sharedAudioCtx = null;
    ctxToClose.close().catch(() => {});
  }
}

/**
 * Memory-optimized voice level monitor (0..1):
 * - Reuses 1 shared AudioContext across all participants
 * - Samples every 120ms (~8Hz) instead of 60fps rAF
 * - Quantizes output to prevent unnecessary React re-renders during silence
 */
export function useAudioLevel(stream: MediaStream | null, isMuted: boolean): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream || isMuted) {
      setLevel(0);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || audioTracks[0].readyState !== 'live') {
      setLevel(0);
      return;
    }

    const ctx = acquireAudioContext();
    if (!ctx) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;

    try {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Smallest FFT size (32 bins) for minimal memory & CPU
      analyser.smoothingTimeConstant = 0.5;

      const isolated = new MediaStream([audioTracks[0]]);
      source = ctx.createMediaStreamSource(isolated);
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastQuantized = 0;

      intervalId = setInterval(() => {
        if (!analyser || document.hidden) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const normalized = Math.min(1, Math.max(0, (avg - 8) / 48));
        // Quantize to steps of 0.1 so silent/steady tiles trigger ZERO re-renders
        const quantized = Math.round(normalized * 10) / 10;
        if (quantized !== lastQuantized) {
          lastQuantized = quantized;
          setLevel(quantized);
        }
      }, 120);
    } catch {
      setLevel(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      try {
        source?.disconnect();
        analyser?.disconnect();
      } catch {
        // ignore cleanup errors
      }
      releaseAudioContext();
    };
  }, [stream, isMuted]);

  return level;
}
