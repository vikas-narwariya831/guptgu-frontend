import { memo, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Hand,
  Smile,
  MessageSquare,
  Users,
  PhoneOff,
  Link2,
  Check,
  ShieldCheck,
  Gauge
} from 'lucide-react';
import type { WebSpeedInfo } from '../../hooks/useNetworkSpeed';
import type {
  ActiveSidebar,
  NetworkStats,
  RoomSettings,
  VideoQualityMode
} from '../../types/meet';

interface ControlBarProps {
  isHost: boolean;
  roomSettings: RoomSettings;
  waitingCount: number;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  activeSidebar: ActiveSidebar;
  unreadCount: number;
  participantCount: number;
  copied: boolean;
  videoQualityMode: VideoQualityMode;
  networkStats: NetworkStats;
  webSpeed: WebSpeedInfo;
  onSelectQuality: (mode: VideoQualityMode) => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleSidebar: (panel: 'chat' | 'participants' | 'host') => void;
  onCopyLink: () => void;
  onLeave: () => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏'];

const QUALITY_OPTIONS: Array<{
  id: VideoQualityMode;
  label: string;
  desc: string;
}> = [
  { id: 'auto', label: 'Auto (Adaptive)', desc: 'Throttles automatically on weak internet' },
  { id: 'hd', label: 'High Definition (720p)', desc: 'Best video clarity on fast Wi-Fi' },
  { id: 'data-saver', label: 'Data Saver (360p)', desc: '~220 kbps · Smooth on 3G / weak 4G' },
  { id: 'audio-only', label: 'Audio Only', desc: '~32 kbps · Pauses video for 2G/low net' }
];

function ControlBar({
  isHost,
  roomSettings,
  waitingCount,
  isMuted,
  isCameraOff,
  isScreenSharing,
  isHandRaised,
  activeSidebar,
  unreadCount,
  participantCount,
  copied,
  videoQualityMode,
  networkStats,
  webSpeed,
  onSelectQuality,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHandRaise,
  onSendReaction,
  onToggleSidebar,
  onCopyLink,
  onLeave
}: ControlBarProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const micLockedByHost = !isHost && isMuted && !roomSettings.allowUnmute;
  const screenLockedByHost = !isHost && !isScreenSharing && !roomSettings.allowScreenShare;

  return (
    <div className="relative flex items-center justify-center px-3 pb-4 pt-1 z-30">
      {showEmojiPicker && (
        <div className="absolute bottom-22 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-[#E4E7E4] shadow-[0_16px_40px_-8px_rgba(17,24,39,0.16)]">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSendReaction(emoji);
                setShowEmojiPicker(false);
              }}
              className="w-9 h-9 rounded-xl hover:bg-[#EDF7F2] text-xl flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {showQualityMenu && (
        <div className="absolute bottom-22 left-1/2 -translate-x-1/2 w-80 p-3.5 rounded-2xl bg-white border border-[#E4E7E4] shadow-[0_16px_40px_-8px_rgba(17,24,39,0.18)] space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#111827]">Network &amp; Quality</span>
            <span className="text-[11px] font-mono font-semibold text-[#0D6E4E] bg-[#EDF7F2] border border-[#CBE7D8] px-2 py-0.5 rounded-full">
              {networkStats.activeCapKbps} kbps
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#6B7280] bg-[#FAFBF9] border border-[#E4E7E4] rounded-xl p-2">
            <span>
              Web: <strong className="text-[#111827] font-mono">{webSpeed.downlinkMbps !== null ? `${webSpeed.downlinkMbps} Mbps` : webSpeed.effectiveType}</strong>
            </span>
            <span>
              Ping: <strong className="text-[#111827] font-mono">{networkStats.rttMs ?? webSpeed.pingMs ?? '—'} ms</strong>
            </span>
            <span>
              Live ↑/↓: <strong className="text-[#111827] font-mono">{networkStats.uploadKbps}/{networkStats.downloadKbps} kbps</strong>
            </span>
            <span>
              Loss:{' '}
              <strong
                className={
                  networkStats.quality === 'poor'
                    ? 'text-rose-600'
                    : networkStats.quality === 'fair'
                    ? 'text-amber-600'
                    : 'text-[#0D6E4E]'
                }
              >
                {networkStats.packetLossPct}%
              </strong>
            </span>
          </div>

          <div className="space-y-1">
            {QUALITY_OPTIONS.map((opt) => {
              const active = videoQualityMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectQuality(opt.id);
                    setShowQualityMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-[#EDF7F2] border-[#CBE7D8] text-[#0B4F38]'
                      : 'bg-[#FAFBF9] hover:bg-[#F3F5F3] border-transparent text-[#374151]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-[#6B7280]">{opt.desc}</p>
                  </div>
                  {active && <Check size={14} className="text-[#0D6E4E] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-white/98 md:bg-white/95 md:backdrop-blur-xl border border-[#E4E7E4] shadow-[0_1px_3px_rgba(16,24,40,0.04),0_20px_45px_-14px_rgba(16,24,40,0.14)] flex-wrap justify-center">
        {/* Mic */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`relative h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
            micLockedByHost
              ? 'bg-rose-50 text-rose-400 border border-rose-200 cursor-not-allowed'
              : isMuted
              ? 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-sm'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E] cursor-pointer hover:-translate-y-0.5'
          }`}
          title={
            micLockedByHost ? 'Host disabled unmuting' : isMuted ? 'Unmute (M)' : 'Mute (M)'
          }
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Camera */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isCameraOff
              ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E] hover:-translate-y-0.5'
          }`}
          title={isCameraOff ? 'Turn Camera On (V)' : 'Turn Camera Off (V)'}
        >
          {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
        </button>

        {/* Screen Share */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`h-11 px-3.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${
            screenLockedByHost
              ? 'bg-[#F3F5F3] text-[#9CA3AF] cursor-not-allowed'
              : isScreenSharing
              ? 'bg-[#0D6E4E] text-white hover:bg-[#0A573D] shadow-md shadow-[#0D6E4E]/20 cursor-pointer'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E] cursor-pointer hover:-translate-y-0.5'
          }`}
          title={
            screenLockedByHost
              ? 'Host disabled screen sharing'
              : isScreenSharing
              ? 'Stop Sharing Screen'
              : 'Share Screen'
          }
        >
          {isScreenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
          <span className="hidden sm:inline">{isScreenSharing ? 'Stop Share' : 'Present'}</span>
        </button>

        {/* Network / Data Saver */}
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker(false);
            setShowQualityMenu((p) => !p);
          }}
          className={`h-11 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            showQualityMenu || videoQualityMode === 'data-saver' || videoQualityMode === 'audio-only'
              ? 'bg-[#EDF7F2] text-[#0D6E4E] border border-[#CBE7D8]'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E]'
          }`}
          title="Bandwidth & Low-Internet Mode"
        >
          <Gauge size={17} />
          <span className="hidden lg:inline">
            {videoQualityMode === 'audio-only'
              ? 'Audio Only'
              : videoQualityMode === 'data-saver' || networkStats.isThrottled
              ? 'Data Saver'
              : videoQualityMode === 'hd'
              ? 'HD'
              : 'Auto'}
          </span>
        </button>

        <div className="w-px h-6 bg-[#E6E9E6] hidden sm:block mx-0.5" />

        {/* Raise Hand */}
        <button
          type="button"
          onClick={onToggleHandRaise}
          className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isHandRaised
              ? 'bg-amber-400 text-[#111827] hover:bg-amber-300 shadow-sm'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E] hover:-translate-y-0.5'
          }`}
          title="Raise Hand"
        >
          <Hand size={18} />
        </button>

        {/* Reactions */}
        <button
          type="button"
          onClick={() => {
            setShowQualityMenu(false);
            setShowEmojiPicker((p) => !p);
          }}
          className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            showEmojiPicker
              ? 'bg-[#EDF7F2] text-[#0D6E4E] border border-[#CBE7D8]'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E] hover:-translate-y-0.5'
          }`}
          title="Send Reaction"
        >
          <Smile size={18} />
        </button>

        {/* Copy Invite Link */}
        <button
          type="button"
          onClick={onCopyLink}
          className="h-11 w-11 rounded-xl bg-[#F3F5F3] hover:bg-[#EDF7F2] text-[#1F2937] hover:text-[#0D6E4E] flex items-center justify-center transition-all cursor-pointer hover:-translate-y-0.5"
          title="Copy Meeting Invite Link"
        >
          {copied ? <Check size={18} className="text-[#0D6E4E]" /> : <Link2 size={18} />}
        </button>

        <div className="w-px h-6 bg-[#E6E9E6] hidden sm:block mx-0.5" />

        {/* Participants */}
        <button
          type="button"
          onClick={() => onToggleSidebar('participants')}
          className={`relative h-11 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSidebar === 'participants'
              ? 'bg-[#0D6E4E] text-white shadow-sm'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E]'
          }`}
          title="Participants"
        >
          <Users size={18} />
          <span className="text-xs font-bold">{participantCount}</span>
          {isHost && waitingCount > 0 && activeSidebar !== 'participants' && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[#111827] text-[10px] font-extrabold flex items-center justify-center animate-pulse">
              {waitingCount}
            </span>
          )}
        </button>

        {/* Chat */}
        <button
          type="button"
          onClick={() => onToggleSidebar('chat')}
          className={`relative h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeSidebar === 'chat'
              ? 'bg-[#0D6E4E] text-white shadow-sm'
              : 'bg-[#F3F5F3] text-[#1F2937] hover:bg-[#EDF7F2] hover:text-[#0D6E4E]'
          }`}
          title="In-call Chat"
        >
          <MessageSquare size={18} />
          {unreadCount > 0 && activeSidebar !== 'chat' && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0D6E4E] text-white text-[10px] font-extrabold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Host Controls Shield */}
        {isHost && (
          <button
            type="button"
            onClick={() => onToggleSidebar('host')}
            className={`relative h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeSidebar === 'host'
                ? 'bg-[#0D6E4E] text-white shadow-sm'
                : 'bg-[#EDF7F2] text-[#0D6E4E] border border-[#CBE7D8] hover:bg-[#DCEFE5]'
            }`}
            title="Host Controls"
          >
            <ShieldCheck size={18} />
          </button>
        )}

        {/* Leave */}
        <button
          type="button"
          onClick={onLeave}
          className="h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/20 ml-1"
          title={isHost ? 'Leave or End Meeting' : 'Leave Meeting'}
        >
          <PhoneOff size={17} />
          <span className="hidden md:inline text-xs">Leave</span>
        </button>
      </div>
    </div>
  );
}

export default memo(ControlBar);
