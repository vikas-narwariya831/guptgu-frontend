import { memo, useEffect, useRef } from 'react';
import { MicOff, MonitorUp, Hand, Pin, PinOff, Crown } from 'lucide-react';
import { useAudioLevel } from '../../hooks/useAudioLevel';

interface VideoTileProps {
  name: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

function VideoTile({
  name,
  stream,
  isLocal = false,
  isMuted,
  isCameraOff,
  isScreenSharing,
  isHandRaised = false,
  isHost = false,
  isPinned = false,
  onTogglePin
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioLevel = useAudioLevel(stream, isMuted);
  const isSpeaking = !isMuted && audioLevel > 0.1;

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
  }, [stream]);

  const hasLiveVideo =
    Boolean(stream && stream.getVideoTracks().some((t) => t.readyState === 'live')) &&
    (!isCameraOff || isScreenSharing);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'G';

  return (
    <div
      className={`group relative overflow-hidden rounded-[22px] border transition-all duration-300 ${
        hasLiveVideo
          ? 'bg-[#111614]'
          : 'bg-gradient-to-br from-white via-[#F9FCFA] to-[#EFF7F3]'
      } ${
        isScreenSharing
          ? 'border-[#0D6E4E] ring-4 ring-[#0D6E4E]/15 shadow-lg'
          : isSpeaking
          ? 'border-[#0D6E4E] ring-4 ring-[#0D6E4E]/15 shadow-md'
          : isHandRaised
          ? 'border-amber-400 ring-4 ring-amber-400/15 shadow-md'
          : 'border-[#E4E7E4] hover:border-[#CBE7D8] shadow-[0_1px_3px_rgba(16,24,40,0.04)]'
      } flex items-center justify-center w-full h-full min-h-[200px]`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full ${isScreenSharing ? 'object-contain bg-[#0A0E0C]' : 'object-cover'} ${
          isLocal && !isScreenSharing ? '-scale-x-100' : ''
        } ${hasLiveVideo ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}
      />

      {!hasLiveVideo && (
        <div className="flex flex-col items-center justify-center gap-3 select-none">
          <div
            className={`w-22 h-22 rounded-full bg-white border-2 transition-all duration-200 flex items-center justify-center text-2xl font-extrabold text-[#0D6E4E] shadow-sm ${
              isSpeaking
                ? 'border-[#0D6E4E] ring-8 ring-[#0D6E4E]/12 scale-105'
                : 'border-[#CBE7D8] ring-8 ring-[#0D6E4E]/[0.04]'
            }`}
          >
            {initials}
          </div>
          <span className="text-xs text-[#6B7280] font-medium">
            {isLocal ? 'Your camera is off' : 'Camera paused'}
          </span>
        </div>
      )}

      {hasLiveVideo && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
      )}

      {/* Top Badges */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5">
          {isScreenSharing && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D6E4E] text-white text-[11px] font-bold shadow-md">
              <MonitorUp size={12} />
              Presenting
            </span>
          )}
          {isHandRaised && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-[#111827] text-[11px] font-bold shadow-md animate-bounce">
              <Hand size={12} />
              Hand Raised
            </span>
          )}
        </div>

        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            className="pointer-events-auto opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 rounded-full bg-white/95 hover:bg-white text-[#374151] border border-[#E4E7E4] shadow-md transition-all cursor-pointer"
            title={isPinned ? 'Unpin tile' : 'Pin to spotlight'}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        )}
      </div>

      {/* Bottom Nameplate */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E4E7E4] shadow-sm text-xs font-semibold text-[#111827] max-w-[85%]">
          {isHost && <Crown size={12} className="text-[#0D6E4E] shrink-0" />}
          <span className="truncate">
            {name} {isLocal ? '(You)' : ''}
          </span>

          {isMuted ? (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 shrink-0">
              <MicOff size={11} />
            </span>
          ) : isSpeaking ? (
            <span className="flex items-end gap-0.5 h-3 shrink-0 px-0.5">
              <span
                className="w-0.5 rounded-full bg-[#0D6E4E] transition-all duration-75"
                style={{ height: `${Math.max(35, Math.round(audioLevel * 100))}%` }}
              />
              <span
                className="w-0.5 rounded-full bg-[#0D6E4E] transition-all duration-75"
                style={{ height: `${Math.max(60, Math.round(audioLevel * 100))}%` }}
              />
              <span
                className="w-0.5 rounded-full bg-[#0D6E4E] transition-all duration-75"
                style={{ height: `${Math.max(35, Math.round(audioLevel * 100))}%` }}
              />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default memo(VideoTile);
