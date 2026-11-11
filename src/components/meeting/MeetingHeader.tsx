import { memo } from 'react';
import { Video, Copy, Check, Clock, Lock, ShieldCheck, Users, Wifi } from 'lucide-react';
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
  // Timer lives inside header only — prevents 1-second full-app re-renders!
  const elapsedSeconds = useMeetingTimer(true, meetingStartedAt);
  const signalColor =
    networkStats.quality === 'poor'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : networkStats.quality === 'fair'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-[#0D6E4E] bg-[#EDF7F2] border-[#CBE7D8]';

  const modeBadge =
    videoQualityMode === 'audio-only'
      ? 'Audio Only'
      : videoQualityMode === 'data-saver' || networkStats.isThrottled
      ? 'Data Saver'
      : networkStats.rttMs !== null
      ? `${networkStats.rttMs} ms`
      : webSpeed.pingMs !== null
      ? `${webSpeed.pingMs} ms`
      : 'HD Live';

  const speedText =
    networkStats.uploadKbps > 0 || networkStats.downloadKbps > 0
      ? `↑${networkStats.uploadKbps} ↓${networkStats.downloadKbps} kbps`
      : webSpeed.downlinkMbps !== null
      ? `↓ ${webSpeed.downlinkMbps} Mbps`
      : webSpeed.effectiveType;

  return (
    <header className="h-14 px-3 sm:px-6 border-b border-[#E6E9E6] bg-white md:bg-white/95 md:backdrop-blur-md flex items-center justify-between gap-2 shrink-0 z-20">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#0D6E4E] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#0D6E4E]/20">
          <Video size={16} />
        </div>
        <span className="font-extrabold text-[15px] tracking-[-0.02em] text-[#111827] hidden sm:inline">
          Guptgu
        </span>

        <span className="text-[#D1D5DB] hidden sm:inline">/</span>

        <button
          type="button"
          onClick={onCopyInvite}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-mono font-semibold transition-all cursor-pointer max-w-[140px] sm:max-w-none truncate ${
            copied
              ? 'bg-[#EDF7F2] border-[#CBE7D8] text-[#0D6E4E]'
              : 'bg-[#FAFBF9] hover:bg-[#EDF7F2]/60 border-[#E4E7E4] hover:border-[#CBE7D8] text-[#374151]'
          }`}
          title="Copy room invite link"
        >
          <span className="truncate">{roomId}</span>
          {copied ? (
            <Check size={13} className="text-[#0D6E4E] shrink-0" />
          ) : (
            <Copy size={13} className="text-[#9CA3AF] shrink-0" />
          )}
        </button>

        {isLocked && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
            <Lock size={11} /> Locked
          </span>
        )}

        {isHost && (
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EDF7F2] border border-[#CBE7D8] text-[11px] font-semibold text-[#0D6E4E]">
            <ShieldCheck size={12} /> Host
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Live Web Speed Pill */}
        <button
          type="button"
          onClick={webSpeed.refresh}
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-semibold transition-colors cursor-pointer ${signalColor}`}
          title={`Web Speed: ${webSpeed.downlinkMbps ?? '?'} Mbps (${webSpeed.effectiveType}) · Loss: ${networkStats.packetLossPct}% · Cap: ${networkStats.activeCapKbps} kbps`}
        >
          <Wifi size={12} />
          <span>{speedText}</span>
          <span className="opacity-75 font-sans">· {modeBadge}</span>
        </button>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F5F3] text-xs font-semibold text-[#374151]">
          <Users size={13} className="text-[#6B7280]" />
          <span>{participantCount}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDF7F2] border border-[#CBE7D8] text-xs font-mono font-semibold text-[#0B4F38] tabular-nums">
          <span className="w-2 h-2 rounded-full bg-[#0D6E4E] animate-pulse" />
          <Clock size={12} className="text-[#0D6E4E]" />
          <span>{formatElapsed(elapsedSeconds)}</span>
        </div>
      </div>
    </header>
  );
}

export default memo(MeetingHeader);
