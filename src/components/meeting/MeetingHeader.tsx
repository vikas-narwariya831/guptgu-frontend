import { memo } from 'react';
import { Copy, Check, Lock, Users, Wifi } from 'lucide-react';
import { formatElapsed } from '../../utils/roomUtils';
import { useMeetingTimer } from '../../hooks/useMeetingTimer';
import type { WebSpeedInfo } from '../../hooks/useNetworkSpeed';
import type { NetworkStats, VideoQualityMode } from '../../types/meet';

interface MeetingHeaderProps {
  roomId: string;
  copied: boolean;
  isLocked: boolean;
  isHost: boolean;
  participantCount: number;
  meetingStartedAt: number;
  videoQualityMode: VideoQualityMode;
  networkStats: NetworkStats;
  webSpeed: WebSpeedInfo;
  onCopyInvite: () => void;
}

function MeetingHeader({
  roomId,
  copied,
  isLocked,
  isHost,
  participantCount,
  meetingStartedAt,
  videoQualityMode,
  networkStats,
  webSpeed,
  onCopyInvite
}: MeetingHeaderProps) {
  const elapsedSeconds = useMeetingTimer(true, meetingStartedAt);

  const signalDotColor =
    networkStats.quality === 'poor'
      ? 'bg-rose-500'
      : networkStats.quality === 'fair'
      ? 'bg-amber-400'
      : 'bg-emerald-500';

  const modeLabel =
    videoQualityMode === 'audio-only'
      ? 'Audio'
      : videoQualityMode === 'data-saver' || networkStats.isThrottled
      ? 'Lite'
      : 'HD';

  return (
    <header className="h-12 sm:h-13 px-3 sm:px-5 border-b border-white/[0.06] bg-[#0E1116] flex items-center justify-between gap-2 shrink-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onCopyInvite}
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#171B22] hover:bg-[#1E242E] border border-white/[0.08] text-xs font-mono text-neutral-200 transition-colors cursor-pointer max-w-[165px] sm:max-w-none truncate"
          title="Copy room invite link"
        >
          <span className="truncate">{roomId}</span>
          {copied ? (
            <Check size={13} className="text-emerald-400 shrink-0" />
          ) : (
            <Copy size={13} className="text-neutral-400 shrink-0" />
          )}
        </button>

        {isLocked && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[11px] font-medium"
            title="Room is locked"
          >
            <Lock size={11} />
          </span>
        )}

        {isHost && (
          <span className="hidden md:inline-block text-[11px] font-medium text-neutral-400 px-1.5">
            Host
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5 text-xs text-neutral-300">
        <button
          type="button"
          onClick={webSpeed.refresh}
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          title={`Net: ${webSpeed.downlinkMbps ?? '?'} Mbps · Loss: ${networkStats.packetLossPct}% · Cap: ${networkStats.activeCapKbps} kbps`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${signalDotColor}`} />
          <Wifi size={12} />
          <span>
            {networkStats.rttMs ?? webSpeed.pingMs ?? '—'}ms · {modeLabel}
          </span>
        </button>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-400">
          <Users size={13} />
          <span>{participantCount}</span>
        </span>

        <span className="font-mono text-xs text-neutral-300 tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>
    </header>
  );
}

export default memo(MeetingHeader);
