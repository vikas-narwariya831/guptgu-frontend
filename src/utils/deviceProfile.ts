export interface DeviceProfile {
  isMobile: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
  saveData: boolean;
  isLowRamDevice: boolean;
}

interface NavigatorWithDeviceInfo extends Navigator {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
}

function detectDeviceProfile(): DeviceProfile {
  if (typeof navigator === 'undefined') {
    return {
      isMobile: false,
      deviceMemoryGb: null,
      hardwareConcurrency: null,
      saveData: false,
      isLowRamDevice: false
    };
  }

  const nav = navigator as NavigatorWithDeviceInfo;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const deviceMemoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const hardwareConcurrency =
    typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;
  const saveData = Boolean(nav.connection?.saveData);

  const isLowRamDevice =
    (deviceMemoryGb !== null && deviceMemoryGb <= 3) ||
    (isMobile && hardwareConcurrency !== null && hardwareConcurrency <= 4) ||
    saveData ||
    nav.connection?.effectiveType === '2g' ||
    nav.connection?.effectiveType === 'slow-2g';

  return {
    isMobile,
    deviceMemoryGb,
    hardwareConcurrency,
    saveData,
    isLowRamDevice
  };
}

export const DEVICE_PROFILE: DeviceProfile = detectDeviceProfile();

export function getCameraVideoConstraints(
  liteMode: boolean,
  videoDeviceId?: string
): MediaTrackConstraints {
  let width: ConstrainULong;
  let height: ConstrainULong;
  let frameRate: ConstrainDouble;

  if (liteMode) {
    // 2GB RAM phones: low-footprint capture cuts Camera2 & encoder buffers by ~60%
    width = { ideal: 480, max: 640 };
    height = { ideal: 270, max: 360 };
    frameRate = { ideal: 12, max: 15 };
  } else if (DEVICE_PROFILE.isMobile) {
    width = { ideal: 640 };
    height = { ideal: 360 };
    frameRate = { ideal: 18, max: 24 };
  } else {
    width = { ideal: 1280 };
    height = { ideal: 720 };
    frameRate = { ideal: 28, max: 30 };
  }

  return videoDeviceId
    ? { deviceId: { exact: videoDeviceId }, width, height, frameRate }
    : { width, height, frameRate, facingMode: 'user' };
}

export function getScreenShareVideoConstraints(liteMode: boolean): MediaTrackConstraints {
  const isPortrait =
    typeof window !== 'undefined' &&
    typeof window.screen !== 'undefined' &&
    window.screen.height > window.screen.width;

  if (liteMode || DEVICE_PROFILE.isMobile) {
    const longTarget = liteMode ? 854 : 1024;
    const shortTarget = liteMode ? 480 : 576;
    return {
      width: { ideal: isPortrait ? shortTarget : longTarget },
      height: { ideal: isPortrait ? longTarget : shortTarget },
      frameRate: { ideal: liteMode ? 6 : 10, max: liteMode ? 10 : 15 }
    };
  }

  return {
    frameRate: { ideal: 15, max: 20 }
  };
}

/**
 * Downscales acquired screen capture buffers (especially portrait 1080x2400 Android displays)
 * and returns any extra RTCRtpSender scaleResolutionDownBy factor needed.
 */
export async function optimizeAcquiredScreenTrack(
  track: MediaStreamTrack,
  liteMode: boolean
): Promise<number> {
  if ('contentHint' in track) {
    track.contentHint = 'detail';
  }

  const maxLongSide = liteMode ? 854 : DEVICE_PROFILE.isMobile ? 1024 : 0;
  if (maxLongSide === 0) return 1;

  try {
    const before = track.getSettings();
    const w = before.width || 0;
    const h = before.height || 0;
    const longSide = Math.max(w, h);

    if (longSide > maxLongSide && w > 0 && h > 0) {
      const ratio = maxLongSide / longSide;
      const targetW = Math.max(2, Math.floor((w * ratio) / 2) * 2);
      const targetH = Math.max(2, Math.floor((h * ratio) / 2) * 2);
      await track.applyConstraints({
        width: { max: targetW },
        height: { max: targetH },
        frameRate: { ideal: liteMode ? 6 : 10, max: liteMode ? 10 : 15 }
      });
    } else {
      await track.applyConstraints({
        frameRate: { ideal: liteMode ? 6 : 10, max: liteMode ? 10 : 15 }
      });
    }
  } catch {
    // Fallback to encoder-side scaleResolutionDownBy below
  }

  const after = track.getSettings();
  const afterLong = Math.max(after.width || 0, after.height || 0);
  if (afterLong > maxLongSide) {
    return Math.min(4, Math.max(1, Number((afterLong / maxLongSide).toFixed(2))));
  }
  return 1;
}

/**
 * Reorders video codecs on low-RAM / mobile devices so hardware-friendly H264 & VP8
 * take priority over CPU-heavy VP9/AV1, keeping paired RTX entries valid.
 */
export function prioritizeLightweightVideoCodecs(pc: RTCPeerConnection, enabled: boolean): void {
  if (!enabled || typeof RTCRtpSender === 'undefined' || !RTCRtpSender.getCapabilities) {
    return;
  }

  const caps = RTCRtpSender.getCapabilities('video');
  if (!caps?.codecs?.length) return;

  const isLightCodec = (mime: string) => {
    const m = mime.toLowerCase();
    return m === 'video/h264' || m === 'video/vp8';
  };
  const isRtx = (mime: string) => mime.toLowerCase() === 'video/rtx';

  const lightCodecs: typeof caps.codecs = [];
  const otherBaseCodecs: typeof caps.codecs = [];
  const utilityCodecs: typeof caps.codecs = [];
  const rtxCodecs: typeof caps.codecs = [];

  for (const codec of caps.codecs) {
    const mime = codec.mimeType.toLowerCase();
    if (isRtx(mime)) {
      rtxCodecs.push(codec);
    } else if (mime === 'video/red' || mime === 'video/ulpfec' || mime === 'video/flexfec-03') {
      utilityCodecs.push(codec);
    } else if (isLightCodec(mime)) {
      lightCodecs.push(codec);
    } else {
      otherBaseCodecs.push(codec);
    }
  }

  if (lightCodecs.length === 0) return;

  const reordered = [...lightCodecs, ...otherBaseCodecs, ...rtxCodecs, ...utilityCodecs];

  for (const transceiver of pc.getTransceivers()) {
    const kind = transceiver.sender?.track?.kind || transceiver.receiver?.track?.kind;
    if (kind === 'video' && typeof transceiver.setCodecPreferences === 'function') {
      try {
        transceiver.setCodecPreferences(reordered);
      } catch {
        // Browser may reject specific preference combinations; safely keep default
      }
    }
  }
}
