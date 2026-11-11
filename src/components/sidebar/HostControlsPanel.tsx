import { ShieldCheck, VolumeX, Power } from 'lucide-react';
import type { RoomSettings } from '../../types/meet';

interface HostControlsPanelProps {
  roomSettings: RoomSettings;
  onUpdateSettings: (partial: Partial<RoomSettings>) => void;
  onMuteAll: () => void;
  onEndMeetingForAll: () => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#1A1F28] border border-white/[0.06]">
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-100">{label}</p>
        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer mt-0.5 ${
          checked ? 'bg-emerald-600' : 'bg-neutral-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function HostControlsPanel({
  roomSettings,
  onUpdateSettings,
  onMuteAll,
  onEndMeetingForAll
}: HostControlsPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-[#12161D]">
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400" /> Room Controls
        </h3>
        <p className="text-[11px] text-neutral-400">
          Manage access and participant permissions.
        </p>
      </div>

      <div className="space-y-2">
        <ToggleRow
          label="Lock room"
          description="Prevent new people from joining."
          checked={roomSettings.isLocked}
          onChange={(val) => onUpdateSettings({ isLocked: val })}
        />
        <ToggleRow
          label="Waiting room"
          description="Admit guests manually before they enter."
          checked={roomSettings.waitingRoomEnabled}
          onChange={(val) => onUpdateSettings({ waitingRoomEnabled: val })}
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-white/[0.07]">
        <h4 className="text-[11px] font-medium text-neutral-400">
          Participants can
        </h4>
        <ToggleRow
          label="Share screen"
          description="Allow participants to present their screen."
          checked={roomSettings.allowScreenShare}
          onChange={(val) => onUpdateSettings({ allowScreenShare: val })}
        />
        <ToggleRow
          label="Send messages"
          description="Allow chat messages during the call."
          checked={roomSettings.allowChat}
          onChange={(val) => onUpdateSettings({ allowChat: val })}
        />
        <ToggleRow
          label="Unmute themselves"
          description="When off, participants stay muted."
          checked={roomSettings.allowUnmute}
          onChange={(val) => onUpdateSettings({ allowUnmute: val })}
        />
      </div>

      <div className="pt-3 border-t border-white/[0.07] space-y-2">
        <button
          type="button"
          onClick={onMuteAll}
          className="w-full py-2.5 px-3 rounded-lg bg-[#1A1F28] hover:bg-rose-500/15 border border-white/[0.08] text-xs font-medium text-neutral-200 hover:text-rose-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <VolumeX size={14} className="text-rose-400" />
          <span>Mute all</span>
        </button>

        <button
          type="button"
          onClick={onEndMeetingForAll}
          className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Power size={14} />
          <span>End call for everyone</span>
        </button>
      </div>
    </div>
  );
}
