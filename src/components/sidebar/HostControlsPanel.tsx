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
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white border border-[#E4E7E4] shadow-2xs">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#111827]">{label}</p>
        <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 cursor-pointer mt-0.5 ${
          checked ? 'bg-[#0D6E4E]' : 'bg-[#D1D5DB]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0'
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFBF9]">
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D6E4E] flex items-center gap-1.5">
          <ShieldCheck size={14} /> Meeting Moderation
        </h3>
        <p className="text-[11px] text-[#6B7280]">
          Keep your Guptgu space private and well-moderated.
        </p>
      </div>

      <div className="space-y-2">
        <ToggleRow
          label="Lock Meeting"
          description="Block all new participants from joining this call."
          checked={roomSettings.isLocked}
          onChange={(val) => onUpdateSettings({ isLocked: val })}
        />
        <ToggleRow
          label="Host Must Admit (Waiting Room)"
          description="Guests must ask to join and wait until you admit them."
          checked={roomSettings.waitingRoomEnabled}
          onChange={(val) => onUpdateSettings({ waitingRoomEnabled: val })}
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-[#E6E9E6]">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
          Let Everyone
        </h4>
        <ToggleRow
          label="Share their screen"
          description="When off, only the host can present their screen."
          checked={roomSettings.allowScreenShare}
          onChange={(val) => onUpdateSettings({ allowScreenShare: val })}
        />
        <ToggleRow
          label="Send chat messages"
          description="Allow participants to post messages in In-call Chat."
          checked={roomSettings.allowChat}
          onChange={(val) => onUpdateSettings({ allowChat: val })}
        />
        <ToggleRow
          label="Turn on their microphone"
          description="When off, all participants stay muted until re-enabled."
          checked={roomSettings.allowUnmute}
          onChange={(val) => onUpdateSettings({ allowUnmute: val })}
        />
      </div>

      <div className="pt-3 border-t border-[#E6E9E6] space-y-2">
        <button
          type="button"
          onClick={onMuteAll}
          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 border border-[#E4E7E4] text-xs font-semibold text-[#111827] hover:text-rose-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <VolumeX size={14} className="text-rose-600" />
          <span>Mute All Participants</span>
        </button>

        <button
          type="button"
          onClick={onEndMeetingForAll}
          className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-rose-600/20"
        >
          <Power size={14} />
          <span>End Meeting for Everyone</span>
        </button>
      </div>
    </div>
  );
}
