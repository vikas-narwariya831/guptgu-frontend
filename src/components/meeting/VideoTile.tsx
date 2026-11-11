import { memo, useEffect, useMemo, useRef } from 'react';
import { MicOff, MonitorUp, Hand, Pin, PinOff, Crown } from 'lucide-react';
import { useAudioLevel } from '../../hooks/useAudioLevel';

interface VideoTileProps {
  peerId: string;
  name: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isPinned?: boolean;
  liteMode?: boolean;
  disableVideoDecoder?: boolean;
  onTogglePin?: (peerId: string) => void;
}

function VideoTile({
  peerId,
  name,
  stream,
  isLocal = false,
  isMuted,
  isCameraOff,
  isScreenSharing,
  isHandRaised = false,
  isHost = false,
  isPinned = false,
  liteMode = false,
  disableVideoDecoder = false,
  onTogglePin
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioLevel = useAudioLevel(stream, isMuted, !liteMode);
  const isSpeaking = !isMuted && audioLevel > 0.1;

  const hasLiveVideo =
    Boolean(stream && stream.getVideoTracks().some((t) => t.readyState === 'live')) &&
    (!isCameraOff || isScreenSharing);

  const shouldRenderVideo = hasLiveVideo && !disableVideoDecoder;

  const audioTrackSignature =
    stream
      ?.getAudioTracks()
      .map((t) => t.id)
      .join(',') || '';

  const audioOnlyStream = useMemo(() => {
    if (shouldRenderVideo || isLocal || !stream) return null;
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  }, [shouldRenderVideo, isLocal, stream, audioTrackSignature]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const nextObj = shouldRenderVideo ? stream : null;
    if (videoEl.srcObject !== nextObj) {
      videoEl.srcObject = nextObj;
    }
    return () => {
      if (videoEl.srcObject) videoEl.srcObject = null;
    };
  }, [stream, shouldRenderVideo]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (audioEl.srcObject !== audioOnlyStream) {
      audioEl.srcObject = audioOnlyStream;
    }
    return () => {
      if (audioEl.srcObject) audioEl.srcObject = null;
    };
  }, [audioOnlyStream]);

  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || 'G';

  const statusSubtitle =
    disableVideoDecoder && hasLiveVideo
      ? isLocal
        ? 'Camera active · Lite mode'
        : 'Audio only · Tap to view'
      : isLocal
      ? 'Camera off'
      : '';

  const borderClass = isScreenSharing
    ? 'border-emerald-500/60'
    : isSpeaking
    ? 'border-emerald-500'
    : isHandRaised
    ? 'border-amber-400/70'
    : 'border-white/[0.08]';

  return (
    <div
      className={`gpu-contain group relative overflow-hidden rounded-xl sm:rounded-2xl border bg-[#161A22] transition-colors duration-150 ${borderClass} flex items-center justify-center w-full h-full min-h-[150px] sm:min-h-[200px]`}
    >
      {shouldRenderVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          disablePictureInPicture
          muted={isLocal}
          className={`w-full h-full ${isScreenSharing ? 'object-contain bg-[#0A0C10]' : 'object-cover'} ${
            isLocal && !isScreenSharing ? '-scale-x-100' : ''
          }`}
        />
      ) : (
        <>
          {audioOnlyStream && <audio ref={audioRef} autoPlay playsInline className="hidden" />}
          <div className="flex flex-col items-center justify-center gap-2 select-none px-2 text-center">
            <div
              className={`${
                liteMode ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-20 sm:h-20'
              } rounded-full bg-[#232936] border flex items-center justify-center text-lg sm:text-xl font-semibold text-neutral-100 ${
                isSpeaking ? 'border-emerald-500' : 'border-white/10'
              }`}
            >
              {initials}
            </div>
            {statusSubtitle && (
              <span className="text-[11px] text-neutral-400 leading-tight">
                {statusSubtitle}
              </span>
            )}
          </div>
        </>
      )}

      {/* Top Overlay Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5">
          {isScreenSharing && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-medium">
              <MonitorUp size={11} />
              Presenting
            </span>
          )}
          {isHandRaised && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[11px] font-semibold">
              <Hand size={11} />
              Raised
            </span>
          )}
        </div>

        {onTogglePin && (
          <button
            type="button"
            onClick={() => onTogglePin(peerId)}
            className="pointer-events-auto opacity-80 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-neutral-200 border border-white/10 transition-opacity cursor-pointer"
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
        )}
      </div>

      {/* Bottom Name Tag */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 text-xs font-medium text-white max-w-[88%]">
          {isHost && <Crown size={11} className="text-amber-400 shrink-0" />}
          <span className="truncate">
            {name}
            {isLocal ? ' (You)' : ''}
          </span>
          {isMuted && <MicOff size={11} className="text-rose-400 shrink-0 ml-0.5" />}
        </div>
      </div>
    </div>
  );
}

export default memo(VideoTile);
