import {
  MicOff,
  VideoOff,
  MonitorUp,
  Hand,
  Crown,
  UserX,
  VolumeX,
  Check,
  Ban
} from 'lucide-react';
import type { PeerInfo, WaitingGuest } from '../../types/meet';

interface ParticipantsPanelProps {
  selfId: string;
  isHost: boolean;
  participants: PeerInfo[];
  waitingList: WaitingGuest[];
  onAdmitGuest: (guestId: string) => void;
  onAdmitAll: () => void;
  onDenyGuest: (guestId: string) => void;
  onMutePeer: (peerId: string) => void;
  onMuteAll: () => void;
  onLowerAllHands: () => void;
  onTransferHost: (peerId: string) => void;
  onRemovePeer: (peerId: string) => void;
}

export default function ParticipantsPanel({
  selfId,
  isHost,
  participants,
  waitingList,
  onAdmitGuest,
  onAdmitAll,
  onDenyGuest,
  onMutePeer,
  onMuteAll,
  onLowerAllHands,
  onTransferHost,
  onRemovePeer
}: ParticipantsPanelProps) {
  const remoteCount = participants.filter((p) => p.id !== selfId).length;
  const raisedHandsCount = participants.filter((p) => p.isHandRaised).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFBF9]">
      {isHost && waitingList.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">
              Waiting to join ({waitingList.length})
            </span>
            {waitingList.length > 1 && (
              <button
                type="button"
                onClick={onAdmitAll}
                className="text-[11px] font-semibold text-[#0D6E4E] hover:underline cursor-pointer"
              >
                Admit all
              </button>
            )}
          </div>

          {waitingList.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-amber-200/80"
            >
              <span className="text-xs font-medium text-[#111827] truncate">{guest.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onDenyGuest(guest.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Deny"
                >
                  <Ban size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onAdmitGuest(guest.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#0D6E4E] hover:bg-[#0A573D] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Admit"
                >
                  <Check size={12} />
                  Admit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isHost && (remoteCount > 0 || raisedHandsCount > 0) && (
        <div className="flex items-center gap-2">
          {remoteCount > 0 && (
            <button
              type="button"
              onClick={onMuteAll}
              className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 border border-[#E4E7E4] text-xs font-semibold text-[#374151] hover:text-rose-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <VolumeX size={13} className="text-rose-600" />
              <span>Mute all</span>
            </button>
          )}
          {raisedHandsCount > 0 && (
            <button
              type="button"
              onClick={onLowerAllHands}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Hand size={13} />
              <span>Lower hands</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {participants.map((p) => {
          const isSelf = p.id === selfId;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-[#E4E7E4] gap-2 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#EDF7F2] border border-[#CBE7D8] flex items-center justify-center text-xs font-bold text-[#0D6E4E] shrink-0">
                  {p.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#111827] truncate flex items-center gap-1.5">
                    <span className="truncate">
                      {p.name} {isSelf ? '(You)' : ''}
                    </span>
                    {p.isHost && <Crown size={12} className="text-[#0D6E4E] shrink-0" />}
                  </div>
                  {p.isScreenSharing && (
                    <span className="text-[10px] text-[#0D6E4E] font-semibold">Sharing screen</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {p.isHandRaised && <Hand size={14} className="text-amber-500 mr-0.5" />}
                {p.isScreenSharing && <MonitorUp size={14} className="text-[#0D6E4E] mr-0.5" />}
                {p.isCameraOff && <VideoOff size={14} className="text-[#9CA3AF] mr-0.5" />}
                {p.isMuted && <MicOff size={14} className="text-rose-500 mr-0.5" />}

                {isHost && !isSelf && (
                  <div className="flex items-center gap-1 pl-1.5 ml-1 border-l border-[#E6E9E6]">
                    {!p.isMuted && (
                      <button
                        type="button"
                        onClick={() => onMutePeer(p.id)}
                        className="p-1.5 rounded-lg hover:bg-[#F3F5F3] text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
                        title={`Mute ${p.name}`}
                      >
                        <VolumeX size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onTransferHost(p.id)}
                      className="p-1.5 rounded-lg hover:bg-[#EDF7F2] text-[#6B7280] hover:text-[#0D6E4E] transition-colors cursor-pointer"
                      title={`Make ${p.name} Host`}
                    >
                      <Crown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePeer(p.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-[#6B7280] hover:text-rose-600 transition-colors cursor-pointer"
                      title={`Remove ${p.name}`}
                    >
                      <UserX size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
