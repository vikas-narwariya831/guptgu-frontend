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
  SlidersHorizontal
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
  liteMode: boolean;
  deviceMemoryGb: number | null;
  videoQualityMode: VideoQualityMode;
  networkStats: NetworkStats;
  webSpeed: WebSpeedInfo;
  onSelectQuality: (mode: VideoQualityMode) => void;
  onToggleLiteMode: (enabled: boolean) => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleSidebar: (panel: 'chat' | 'participants' | 'host') => void;
  onCopyLink: () => void;
  onLeave: () => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '👏'];

const QUALITY_OPTIONS: Array<{
  id: VideoQualityMode;
  label: string;
  desc: string;
}> = [
  { id: 'auto', label: 'Auto', desc: 'Adjusts to your connection' },
  { id: 'hd', label: 'High (720p)', desc: 'Best clarity on Wi-Fi' },
  { id: 'data-saver', label: 'Data Saver', desc: 'Low bandwidth video' },
  { id: 'audio-only', label: 'Audio Only', desc: 'Pause video (~32 kbps)' }
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
  liteMode,
  deviceMemoryGb,
  videoQualityMode,
  networkStats,
  webSpeed,
  onSelectQuality,
  onToggleLiteMode,
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
  const canScreenShare =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');

  return (
    <div className="relative flex items-center justify-center px-2 sm:px-4 py-2.5 sm:py-3 bg-[#0E1116] border-t border-white/[0.06] z-30">
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#1A1F28] border border-white/10">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSendReaction(emoji);
                setShowEmojiPicker(false);
              }}
              className="w-9 h-9 rounded-lg hover:bg-white/10 text-lg flex items-center justify-center cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {showQualityMenu && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[calc(100vw-24px)] sm:w-76 max-w-sm p-3 rounded-xl bg-[#1A1F28] border border-white/10 space-y-2.5 text-neutral-100">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold">Video &amp; Performance</span>
            <span className="text-[11px] font-mono text-neutral-400">
              {networkStats.activeCapKbps} kbps
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-neutral-400 bg-[#12161D] border border-white/[0.06] rounded-lg p-2">
            <span>
              Ping: <strong className="text-neutral-200 font-mono">{networkStats.rttMs ?? webSpeed.pingMs ?? '—'}ms</strong>
            </span>
            <span>
              Loss: <strong className="text-neutral-200 font-mono">{networkStats.packetLossPct}%</strong>
            </span>
            <span>
              Up/Dn:{' '}
              <strong className="text-neutral-200 font-mono">
                {networkStats.uploadKbps}/{networkStats.downloadKbps}k
              </strong>
            </span>
            <span>
              Net: <strong className="text-neutral-200 font-mono">{webSpeed.effectiveType}</strong>
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
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'hover:bg-white/[0.06] text-neutral-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-medium">{opt.label}</p>
                    <p className="text-[10px] text-neutral-400">{opt.desc}</p>
                  </div>
                  {active && <Check size={14} className="text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => onToggleLiteMode(!liteMode)}
              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-100 flex items-center gap-1.5">
                  <span>Low-RAM Lite Mode</span>
                  {deviceMemoryGb !== null && (
                    <span className="text-[10px] font-mono text-neutral-400">
                      ({deviceMemoryGb}GB)
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-neutral-400 leading-snug">
                  Frees camera on screen share &amp; pauses strip previews
                </p>
              </div>
              <span
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                  liteMode ? 'bg-emerald-600 justify-end' : 'bg-neutral-600 justify-start'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white" />
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center max-w-full">
        {/* Mic */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors ${
            micLockedByHost
              ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30 cursor-not-allowed'
              : isMuted
              ? 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer'
              : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C] cursor-pointer'
          }`}
          title={micLockedByHost ? 'Host disabled unmuting' : isMuted ? 'Unmute (M)' : 'Mute (M)'}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Camera */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isCameraOff
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C]'
          }`}
          title={isCameraOff ? 'Turn camera on (V)' : 'Turn camera off (V)'}
        >
          {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
        </button>

        {/* Screen Share */}
        {canScreenShare && (
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`h-10 w-10 sm:w-auto sm:h-11 sm:px-3.5 rounded-full flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
              screenLockedByHost
                ? 'bg-[#171B22] text-neutral-500 cursor-not-allowed'
                : isScreenSharing
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C] cursor-pointer'
            }`}
            title={
              screenLockedByHost
                ? 'Host disabled screen sharing'
                : isScreenSharing
                ? 'Stop sharing'
                : 'Share screen'
            }
          >
            {isScreenSharing ? <MonitorOff size={17} /> : <MonitorUp size={17} />}
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop' : 'Share'}</span>
          </button>
        )}

        {/* Raise Hand */}
        <button
          type="button"
          onClick={onToggleHandRaise}
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isHandRaised
              ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300'
              : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C]'
          }`}
          title="Raise hand"
        >
          <Hand size={17} />
        </button>

        {/* Reactions */}
        <button
          type="button"
          onClick={() => {
            setShowQualityMenu(false);
            setShowEmojiPicker((p) => !p);
          }}
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            showEmojiPicker
              ? 'bg-white text-neutral-950'
              : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C]'
          }`}
          title="Reactions"
        >
          <Smile size={17} />
        </button>

        {/* Quality / Lite Mode */}
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker(false);
            setShowQualityMenu((p) => !p);
          }}
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            showQualityMenu || liteMode
              ? 'bg-[#263230] text-emerald-300 border border-emerald-500/30'
              : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C]'
          }`}
          title="Video quality & Lite mode"
        >
          <SlidersHorizontal size={16} />
        </button>

        {/* Copy Invite Link */}
        <button
          type="button"
          onClick={onCopyLink}
          className="hidden sm:flex h-11 w-11 rounded-full bg-[#1D222B] hover:bg-[#282F3C] text-neutral-100 items-center justify-center transition-colors cursor-pointer"
          title="Copy invite link"
        >
          {copied ? <Check size={17} className="text-emerald-400" /> : <Link2 size={17} />}
        </button>

        {/* Participants */}
        <button
          type="button"
          onClick={() => onToggleSidebar('participants')}
          className={`relative h-10 sm:h-11 px-3 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSidebar === 'participants'
              ? 'bg-neutral-100 text-neutral-950'
              : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C]'
          }`}
          title="Participants"
        >
          <Users size={17} />
          <span className="text-xs font-semibold">{participantCount}</span>
          {isHost && waitingCount > 0 && activeSidebar !== 'participants' && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold flex items-center justify-center">
              {waitingCount}
            </span>
          )}
        </button>

        {/* Chat */}
        <button
          type="button"
          onClick={() => onToggleSidebar('chat')}
          className={`relative h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            activeSidebar === 'chat'
              ? 'bg-neutral-100 text-neutral-950'
              : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C]'
          }`}
          title="Chat"
        >
          <MessageSquare size={17} />
          {unreadCount > 0 && activeSidebar !== 'chat' && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Host Controls */}
        {isHost && (
          <button
            type="button"
            onClick={() => onToggleSidebar('host')}
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeSidebar === 'host'
                ? 'bg-neutral-100 text-neutral-950'
                : 'bg-[#1D222B] text-neutral-100 hover:bg-[#282F3C]'
            }`}
            title="Host settings"
          >
            <ShieldCheck size={17} />
          </button>
        )}

        {/* Leave */}
        <button
          type="button"
          onClick={onLeave}
          className="h-10 sm:h-11 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-2 transition-colors cursor-pointer ml-1"
          title={isHost ? 'Leave or end call' : 'Leave call'}
        >
          <PhoneOff size={16} />
          <span className="hidden md:inline text-xs">Leave</span>
        </button>
      </div>
    </div>
  );
}

export default memo(ControlBar);
