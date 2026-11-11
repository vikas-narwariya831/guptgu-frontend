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
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#12161D]">
      {isHost && waitingList.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/25 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">
              Waiting ({waitingList.length})
            </span>
            {waitingList.length > 1 && (
              <button
                type="button"
                onClick={onAdmitAll}
                className="text-[11px] font-medium text-emerald-400 hover:underline cursor-pointer"
              >
                Admit all
              </button>
            )}
          </div>

          {waitingList.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#1A1F28] border border-white/[0.06]"
            >
              <span className="text-xs font-medium text-neutral-100 truncate">{guest.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onDenyGuest(guest.id)}
                  className="p-1.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                  title="Deny"
                >
                  <Ban size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onAdmitGuest(guest.id)}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
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
              className="flex-1 py-2 px-3 rounded-lg bg-[#1A1F28] hover:bg-rose-500/15 border border-white/[0.07] text-xs font-medium text-neutral-200 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <VolumeX size={13} className="text-rose-400" />
              <span>Mute all</span>
            </button>
          )}
          {raisedHandsCount > 0 && (
            <button
              type="button"
              onClick={onLowerAllHands}
              className="flex-1 py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/20 text-xs font-medium text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Hand size={13} />
              <span>Lower hands</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        {participants.map((p) => {
          const isSelf = p.id === selfId;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1A1F28] border border-white/[0.06] gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#242B38] flex items-center justify-center text-xs font-semibold text-neutral-200 shrink-0">
                  {p.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-neutral-100 truncate flex items-center gap-1.5">
                    <span className="truncate">
                      {p.name} {isSelf ? '(You)' : ''}
                    </span>
                    {p.isHost && <Crown size={11} className="text-amber-400 shrink-0" />}
                  </div>
                  {p.isScreenSharing && (
                    <span className="text-[10px] text-emerald-400">Sharing screen</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {p.isHandRaised && <Hand size={13} className="text-amber-400 mr-0.5" />}
                {p.isScreenSharing && <MonitorUp size={13} className="text-emerald-400 mr-0.5" />}
                {p.isCameraOff && <VideoOff size={13} className="text-neutral-500 mr-0.5" />}
                {p.isMuted && <MicOff size={13} className="text-rose-400 mr-0.5" />}

                {isHost && !isSelf && (
                  <div className="flex items-center gap-1 pl-1.5 ml-1 border-l border-white/10">
                    {!p.isMuted && (
                      <button
                        type="button"
                        onClick={() => onMutePeer(p.id)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title={`Mute ${p.name}`}
                      >
                        <VolumeX size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onTransferHost(p.id)}
                      className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title={`Make ${p.name} Host`}
                    >
                      <Crown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePeer(p.id)}
                      className="p-1.5 rounded-md hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
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
