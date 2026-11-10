import { useState, useEffect, useCallback } from 'react';
import { SIGNALING_URL } from '../utils/socket';

export interface WebSpeedInfo {
  downlinkMbps: number | null;
  effectiveType: string;
  pingMs: number | null;
  label: 'Fast' | 'Moderate' | 'Slow';
  refresh: () => void;
}

interface NetworkInformationLike extends EventTarget {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
}

/**
 * Lightweight network speed monitor:
 * - Uses native navigator.connection when available
 * - Pauses HTTP /api/health ping when tab is hidden or WebRTC pc.getStats() is active
 */
export function useNetworkSpeed(pauseBackgroundPing = false): WebSpeedInfo {
  const [downlinkMbps, setDownlinkMbps] = useState<number | null>(null);
  const [effectiveType, setEffectiveType] = useState<string>('4g');
  const [pingMs, setPingMs] = useState<number | null>(null);

  const measure = useCallback(async (forceHttpPing = false) => {
    const navConn = (navigator as unknown as { connection?: NetworkInformationLike }).connection;
    if (navConn) {
      if (typeof navConn.downlink === 'number' && navConn.downlink > 0) {
        setDownlinkMbps(Number(navConn.downlink.toFixed(1)));
      }
      if (navConn.effectiveType) {
        setEffectiveType(navConn.effectiveType.toUpperCase());
      }
      if (typeof navConn.rtt === 'number' && navConn.rtt > 0) {
        setPingMs(Math.round(navConn.rtt));
      }
    }

    if (document.hidden || (pauseBackgroundPing && !forceHttpPing)) return;

    try {
      const start = performance.now();
      const res = await fetch(`${SIGNALING_URL}/api/health`, { cache: 'no-store' });
      if (res.ok) {
        setPingMs(Math.round(performance.now() - start));
      }
    } catch {
      // keep previous reading if offline
    }
  }, [pauseBackgroundPing]);

  useEffect(() => {
    measure();
    const interval = setInterval(() => measure(), 20000);

    const navConn = (navigator as unknown as { connection?: NetworkInformationLike }).connection;
    const onConnChange = () => measure();
    navConn?.addEventListener?.('change', onConnChange);

    return () => {
      clearInterval(interval);
      navConn?.removeEventListener?.('change', onConnChange);
    };
  }, [measure]);

  let label: 'Fast' | 'Moderate' | 'Slow' = 'Fast';
  if (
    (downlinkMbps !== null && downlinkMbps < 1.5) ||
    (pingMs !== null && pingMs > 300) ||
    effectiveType === '2G' ||
    effectiveType === 'SLOW-2G'
  ) {
    label = 'Slow';
  } else if (
    (downlinkMbps !== null && downlinkMbps < 5) ||
    (pingMs !== null && pingMs > 140) ||
    effectiveType === '3G'
  ) {
    label = 'Moderate';
  }

  return {
    downlinkMbps,
    effectiveType,
    pingMs,
    label,
    refresh: () => measure(true)
  };
}
