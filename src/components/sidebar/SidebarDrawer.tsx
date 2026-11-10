import { X, ShieldCheck } from 'lucide-react';
import type {
  ActiveSidebar,
  ChatMessage,
  PeerInfo,
  RoomSettings,
  WaitingGuest
} from '../../types/meet';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import HostControlsPanel from './HostControlsPanel';

interface SidebarDrawerProps {
  activeTab: ActiveSidebar;
  onClose: () => void;
  onSwitchTab: (tab: 'chat' | 'participants' | 'host') => void;
  messages: ChatMessage[];
  selfId: string;
  isHost: boolean;
  selfPeer: PeerInfo;
  remotePeers: PeerInfo[];
  waitingList: WaitingGuest[];
  roomSettings: RoomSettings;
  onSendMessage: (text: string) => void;
  onUpdateSettings: (partial: Partial<RoomSettings>) => void;
  onAdmitGuest: (guestId: string) => void;
  onAdmitAll: () => void;
  onDenyGuest: (guestId: string) => void;
  onMutePeer: (peerId: string) => void;
  onMuteAll: () => void;
  onLowerAllHands: () => void;
  onTransferHost: (peerId: string) => void;
  onRemovePeer: (peerId: string) => void;
  onEndMeetingForAll: () => void;
}

export default function SidebarDrawer({
  activeTab,
  onClose,
  onSwitchTab,
  messages,
  selfId,
  isHost,
  selfPeer,
  remotePeers,
  waitingList,
  roomSettings,
  onSendMessage,
  onUpdateSettings,
  onAdmitGuest,
  onAdmitAll,
  onDenyGuest,
  onMutePeer,
  onMuteAll,
  onLowerAllHands,
  onTransferHost,
  onRemovePeer,
  onEndMeetingForAll
}: SidebarDrawerProps) {
  if (activeTab === 'none') return null;

  const allParticipants = [selfPeer, ...remotePeers];

  return (
    <aside className="w-full sm:w-80 md:w-96 shrink-0 h-full sm:h-auto sm:my-3 sm:mr-3 sm:rounded-2xl bg-white border border-[#E4E7E4] flex flex-col z-40 fixed sm:static inset-0 sm:inset-auto shadow-[0_12px_36px_-8px_rgba(17,24,39,0.1)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#E6E9E6] gap-2">
        <div className="flex items-center gap-1 bg-[#F3F5F3] p-1 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => onSwitchTab('chat')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-white text-[#0D6E4E] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('participants')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'participants'
                ? 'bg-white text-[#0D6E4E] shadow-2xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <span>People ({allParticipants.length})</span>
            {isHost && waitingList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-[#111827] text-[10px] font-bold">
                +{waitingList.length}
              </span>
            )}
          </button>
          {isHost && (
            <button
              type="button"
              onClick={() => onSwitchTab('host')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'host'
                  ? 'bg-[#0D6E4E] text-white shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#0D6E4E]'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Host</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F5F3] transition-colors cursor-pointer shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {activeTab === 'chat' && (
        <ChatPanel
          messages={messages}
          selfId={selfId}
          chatDisabled={!isHost && !roomSettings.allowChat}
          onSendMessage={onSendMessage}
        />
      )}

      {activeTab === 'participants' && (
        <ParticipantsPanel
          selfId={selfId}
          isHost={isHost}
          participants={allParticipants}
          waitingList={waitingList}
          onAdmitGuest={onAdmitGuest}
          onAdmitAll={onAdmitAll}
          onDenyGuest={onDenyGuest}
          onMutePeer={onMutePeer}
          onMuteAll={onMuteAll}
          onLowerAllHands={onLowerAllHands}
          onTransferHost={onTransferHost}
          onRemovePeer={onRemovePeer}
        />
      )}

      {activeTab === 'host' && isHost && (
        <HostControlsPanel
          roomSettings={roomSettings}
          onUpdateSettings={onUpdateSettings}
          onMuteAll={onMuteAll}
          onEndMeetingForAll={onEndMeetingForAll}
        />
      )}
    </aside>
  );
}
